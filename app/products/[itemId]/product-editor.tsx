'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type ModelRow = {
  modelId: number
  name: string
  sku: string
  price: string
  stock: string
  gtin: string
}

type LogisticRow = {
  logisticId: number
  name: string
  enabled: boolean
  shippingFee: string
}

type FiscalState = {
  ncm: string
  origem: string
  cfopMesmo: string
  cfopFora: string
  csosn: string
  unidade: string
  pisCofins: string
  tributos: string
  cest: string
  operacao: string
  recopi: string
  exTipi: string
  fci: string
  infoAdicional: string
  agrupavel: boolean
}

const initialFiscal: FiscalState = {
  ncm: '', origem: '0-Nacional', cfopMesmo: '', cfopFora: '', csosn: '', unidade: 'UN',
  pisCofins: '', tributos: '', cest: '', operacao: '', recopi: '', exTipi: '', fci: '',
  infoAdicional: '', agrupavel: false
}

function moneyValue(value: unknown) {
  if (value == null || value === '') return ''
  return String(Number(value).toFixed(2))
}

function readStock(source: any) {
  return source?.stock_info_v2?.summary_info?.total_available_stock ??
    source?.stock_info_v2?.seller_stock?.reduce?.((sum: number, row: any) => sum + Number(row.stock || 0), 0) ??
    source?.normal_stock ?? source?.stock ?? ''
}

export default function ProductEditor({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rawItem, setRawItem] = useState<any>(null)
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('NEW')
  const [itemSku, setItemSku] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageIds, setImageIds] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [models, setModels] = useState<ModelRow[]>([])
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [differentDimensions, setDifferentDimensions] = useState(false)
  const [logistics, setLogistics] = useState<LogisticRow[]>([])
  const [fiscal, setFiscal] = useState<FiscalState>(initialFiscal)
  const [promotion, setPromotion] = useState('')
  const [schedule, setSchedule] = useState('')

  const sections = {
    basic: useRef<HTMLElement>(null),
    specification: useRef<HTMLElement>(null),
    description: useRef<HTMLElement>(null),
    sales: useRef<HTMLElement>(null),
    fiscal: useRef<HTMLElement>(null),
    shipping: useRef<HTMLElement>(null),
    others: useRef<HTMLElement>(null)
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/shopee/products/${itemId}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o anúncio')

      const item = data.item || {}
      setRawItem(item)
      setItemName(item.item_name || '')
      setDescription(typeof item.description === 'string' ? item.description : item.description?.description || '')
      setCategoryId(String(item.category_id || ''))
      setCondition(item.condition || 'NEW')
      setItemSku(item.item_sku || '')
      setImages(item.image?.image_url_list || [])
      setImageIds((item.image?.image_id_list || []).map(String))
      setWeight(String(item.weight ?? ''))
      setLength(String(item.dimension?.package_length ?? ''))
      setWidth(String(item.dimension?.package_width ?? ''))
      setHeight(String(item.dimension?.package_height ?? ''))
      setPromotion(item.promotion_id ? String(item.promotion_id) : '')

      const modelResponse = data.models?.response || {}
      const rawModels = modelResponse.model || modelResponse.model_list || []
      const normalized = (rawModels.length ? rawModels : [item]).map((model: any, index: number) => ({
        modelId: Number(model.model_id ?? 0),
        name: model.model_name || model.tier_index?.join(' / ') || (rawModels.length ? `Variação ${index + 1}` : 'Produto principal'),
        sku: model.model_sku || item.item_sku || '',
        price: moneyValue(model.price_info?.[0]?.current_price ?? model.price_info?.[0]?.original_price ?? item.price_info?.[0]?.current_price ?? item.price_info?.[0]?.original_price),
        stock: String(readStock(model) ?? readStock(item) ?? ''),
        gtin: model.gtin_code || model.gtin || ''
      }))
      setModels(normalized)

      const channels = data.logistics?.response?.logistics_channel_list || data.logistics?.response?.logistics_channel || []
      const enabledInfo = item.logistic_info || []
      setLogistics(channels.map((channel: any) => {
        const existing = enabledInfo.find((row: any) => Number(row.logistic_id) === Number(channel.logistics_channel_id ?? channel.logistic_id))
        return {
          logisticId: Number(channel.logistics_channel_id ?? channel.logistic_id),
          name: channel.logistics_channel_name || channel.logistic_name || `Canal ${channel.logistics_channel_id ?? channel.logistic_id}`,
          enabled: existing ? Boolean(existing.enabled) : Boolean(channel.enabled),
          shippingFee: existing?.shipping_fee != null ? String(existing.shipping_fee) : ''
        }
      }))

      const savedFiscal = localStorage.getItem(`shopee-fiscal-${itemId}`)
      if (savedFiscal) setFiscal({ ...initialFiscal, ...JSON.parse(savedFiscal) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o anúncio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [itemId])

  function scrollTo(key: keyof typeof sections) {
    sections[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function removeImage(index: number) {
    setImages(current => current.filter((_, i) => i !== index))
    setImageIds(current => current.filter((_, i) => i !== index))
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const nextImages = [...images]
    const nextIds = [...imageIds]
    ;[nextImages[index], nextImages[target]] = [nextImages[target], nextImages[index]]
    ;[nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]]
    setImages(nextImages)
    setImageIds(nextIds)
  }

  function addLocalImages(files: FileList | null) {
    if (!files) return
    const remaining = Math.max(0, 9 - images.length - pendingImages.length)
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPendingImages(current => [...current, String(reader.result || '')])
      reader.readAsDataURL(file)
    })
  }

  function updateModel(index: number, field: keyof ModelRow, value: string) {
    setModels(current => current.map((model, i) => i === index ? { ...model, [field]: value } : model))
  }

  const basePayload = useMemo(() => {
    const payload: any = {
      item_name: itemName,
      description,
      item_sku: itemSku,
      condition,
      weight: Number(weight || 0),
      dimension: {
        package_length: Number(length || 0),
        package_width: Number(width || 0),
        package_height: Number(height || 0)
      }
    }
    if (categoryId) payload.category_id = Number(categoryId)
    if (imageIds.length) payload.image = { image_id_list: imageIds }
    if (rawItem?.attribute_list) payload.attribute_list = rawItem.attribute_list
    if (logistics.length) {
      payload.logistic_info = logistics.map(row => ({
        logistic_id: row.logisticId,
        enabled: row.enabled,
        ...(row.shippingFee ? { shipping_fee: Number(row.shippingFee) } : {})
      }))
    }
    return payload
  }, [itemName, description, itemSku, condition, weight, length, width, height, categoryId, imageIds, rawItem, logistics])

  async function save() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      localStorage.setItem(`shopee-fiscal-${itemId}`, JSON.stringify(fiscal))
      localStorage.setItem(`shopee-editor-extra-${itemId}`, JSON.stringify({ differentDimensions, schedule, promotion }))

      const priceList = models
        .filter(model => model.price !== '')
        .map(model => ({ model_id: model.modelId, original_price: Number(model.price) }))
      const stockList = models
        .filter(model => model.stock !== '')
        .map(model => ({ model_id: model.modelId, seller_stock: [{ stock: Number(model.stock) }] }))

      const response = await fetch(`/api/shopee/products/${itemId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          base: basePayload,
          ...(priceList.length ? { price: { price_list: priceList } } : {}),
          ...(stockList.length ? { stock: { stock_list: stockList } } : {})
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'A Shopee recusou a atualização')
      setSuccess('Alterações enviadas para a Shopee com sucesso.')
      if (pendingImages.length) {
        setSuccess('Dados atualizados. As novas imagens estão em pré-visualização e serão enviadas quando o upload Media Space estiver liberado no app.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto')
    } finally {
      setSaving(false)
    }
  }

  async function toggleListing(unlist: boolean) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/shopee/products/${itemId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ unlist })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar o status')
      setSuccess(unlist ? 'Produto desativado na Shopee.' : 'Produto reativado na Shopee.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="adminShell"><div className="emptyPanel">Carregando anúncio e variações…</div></main>

  return (
    <main className="adminShell productEditorShell">
      <header className="topbar stickyTop">
        <div>
          <Link href="/products" className="backLink">← Meus produtos</Link>
          <h1 className="adminTitle">Editar produto</h1>
          <div className="productMeta">Item ID {itemId}</div>
        </div>
        <div className="topActions">
          <button className="outlineButton" onClick={() => toggleListing(true)} disabled={saving}>Desativar</button>
          <button className="primaryButton compact" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Atualizar'}</button>
        </div>
      </header>

      <nav className="editorTabs">
        <button onClick={() => scrollTo('basic')}>Informação básica</button>
        <button onClick={() => scrollTo('specification')}>Especificação</button>
        <button onClick={() => scrollTo('description')}>Descrição</button>
        <button onClick={() => scrollTo('sales')}>Vendas</button>
        <button onClick={() => scrollTo('fiscal')}>Fiscal</button>
        <button onClick={() => scrollTo('shipping')}>Envio</button>
        <button onClick={() => scrollTo('others')}>Outros</button>
      </nav>

      {error && <div className="notice errorNotice">{error}</div>}
      {success && <div className="notice successNotice">{success}</div>}

      <section ref={sections.basic} className="editorSection">
        <div className="sectionHeading"><div><h2>Informação básica</h2><p>Fotos, nome, categoria e identificação principal do anúncio.</p></div></div>
        <label className="fieldLabel">Imagens do produto</label>
        <div className="imageManager">
          {images.map((src, index) => (
            <div className="imageTile" key={`${src}-${index}`}>
              <img src={src} alt="" />
              {index === 0 && <span className="coverBadge">Capa</span>}
              <div className="imageActions">
                <button onClick={() => moveImage(index, -1)} disabled={index === 0}>←</button>
                <button onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>→</button>
                <button onClick={() => removeImage(index)}>×</button>
              </div>
            </div>
          ))}
          {pendingImages.map((src, index) => <div className="imageTile pendingImage" key={`pending-${index}`}><img src={src} alt="" /><span className="pendingBadge">Nova</span></div>)}
          {images.length + pendingImages.length < 9 && (
            <label className="imageAdd">+<span>Adicionar imagem</span><input type="file" accept="image/*" multiple onChange={e => addLocalImages(e.target.files)} /></label>
          )}
        </div>
        {pendingImages.length > 0 && <p className="helpText">Pré-visualização criada. O envio de novas imagens será ligado ao Media Space assim que a permissão do novo app estiver ativa.</p>}

        <div className="formGrid two">
          <label className="formField full"><span>Nome do produto</span><input value={itemName} maxLength={120} onChange={e => setItemName(e.target.value)} /><small>{itemName.length}/120</small></label>
          <label className="formField"><span>Categoria ID</span><input value={categoryId} onChange={e => setCategoryId(e.target.value)} /></label>
          <label className="formField"><span>SKU principal</span><input value={itemSku} onChange={e => setItemSku(e.target.value)} /></label>
        </div>
      </section>

      <section ref={sections.specification} className="editorSection">
        <div className="sectionHeading"><div><h2>Especificação</h2><p>Atributos retornados pela categoria do produto.</p></div></div>
        {rawItem?.attribute_list?.length ? (
          <div className="attributeGrid">
            {rawItem.attribute_list.map((attribute: any, index: number) => (
              <div className="attributeCard" key={attribute.attribute_id || index}>
                <span>{attribute.attribute_name || `Atributo ${attribute.attribute_id}`}</span>
                <strong>{attribute.attribute_value_list?.map((value: any) => value.value_unit ? `${value.value} ${value.value_unit}` : value.value).join(', ') || '—'}</strong>
              </div>
            ))}
          </div>
        ) : <div className="subtlePanel">Nenhum atributo detalhado retornado para este anúncio.</div>}
      </section>

      <section ref={sections.description} className="editorSection">
        <div className="sectionHeading"><div><h2>Descrição</h2><p>Edite o conteúdo que aparece na página do produto.</p></div></div>
        <label className="formField full"><span>Descrição do produto</span><textarea rows={15} maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} /><small>{description.length}/5000</small></label>
      </section>

      <section ref={sections.sales} className="editorSection">
        <div className="sectionHeading"><div><h2>Informações de vendas</h2><p>Variações, preço, estoque, SKU e GTIN.</p></div></div>
        <div className="variationHeader">
          <div><strong>Variações</strong><div className="helpText">Os preços e estoques abaixo são enviados separadamente pela API.</div></div>
          <button className="outlineButton small" onClick={() => setModels(current => [...current, { modelId: 0, name: `Nova variação ${current.length + 1}`, sku: '', price: '', stock: '0', gtin: '' }])}>+ Adicionar linha</button>
        </div>
        <div className="tableWrap">
          <table className="dataTable">
            <thead><tr><th>Variação</th><th>Preço</th><th>Estoque</th><th>SKU</th><th>GTIN (EAN)</th></tr></thead>
            <tbody>
              {models.map((model, index) => (
                <tr key={`${model.modelId}-${index}`}>
                  <td><input value={model.name} onChange={e => updateModel(index, 'name', e.target.value)} /></td>
                  <td><div className="moneyInput"><span>R$</span><input type="number" step="0.01" value={model.price} onChange={e => updateModel(index, 'price', e.target.value)} /></div></td>
                  <td><input type="number" min="0" value={model.stock} onChange={e => updateModel(index, 'stock', e.target.value)} /></td>
                  <td><input value={model.sku} onChange={e => updateModel(index, 'sku', e.target.value)} /></td>
                  <td><input value={model.gtin} onChange={e => updateModel(index, 'gtin', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="helpText">Nesta etapa, preço e estoque já estão ligados ao backend. Alteração estrutural de nomes/opções de variação será conectada aos endpoints de modelos após validarmos as permissões do novo app.</p>
      </section>

      <section ref={sections.fiscal} className="editorSection">
        <div className="sectionHeading"><div><h2>Informações fiscais <span className="optional">Opcional</span></h2><p>Campos auxiliares no mesmo formato do cadastro da Shopee.</p></div><span className="localBadge">Salvo no painel</span></div>
        <div className="formGrid two">
          <label className="formField"><span>NCM</span><input value={fiscal.ncm} onChange={e => setFiscal({ ...fiscal, ncm: e.target.value })} /></label>
          <label className="formField"><span>Origem</span><select value={fiscal.origem} onChange={e => setFiscal({ ...fiscal, origem: e.target.value })}><option>0-Nacional</option><option>1-Estrangeira importação direta</option><option>2-Estrangeira adquirida no mercado interno</option></select></label>
          <label className="formField"><span>CFOP Venda Mesmo Estado</span><input value={fiscal.cfopMesmo} onChange={e => setFiscal({ ...fiscal, cfopMesmo: e.target.value })} /></label>
          <label className="formField"><span>CSOSN</span><input value={fiscal.csosn} onChange={e => setFiscal({ ...fiscal, csosn: e.target.value })} /></label>
          <label className="formField"><span>CFOP Venda Diferentes Estados</span><input value={fiscal.cfopFora} onChange={e => setFiscal({ ...fiscal, cfopFora: e.target.value })} /></label>
          <label className="formField"><span>Unidade de Medida</span><select value={fiscal.unidade} onChange={e => setFiscal({ ...fiscal, unidade: e.target.value })}><option value="UN">UN (UNIDADE)</option><option value="KG">KG</option><option value="PC">PC</option></select></label>
          <label className="formField"><span>PIS e COFINS CST</span><input value={fiscal.pisCofins} onChange={e => setFiscal({ ...fiscal, pisCofins: e.target.value })} /></label>
          <label className="formField"><span>% total de tributos</span><input value={fiscal.tributos} onChange={e => setFiscal({ ...fiscal, tributos: e.target.value })} /></label>
          <label className="formField"><span>CEST</span><input value={fiscal.cest} onChange={e => setFiscal({ ...fiscal, cest: e.target.value })} /></label>
          <label className="formField"><span>Tipo de Operação</span><input value={fiscal.operacao} onChange={e => setFiscal({ ...fiscal, operacao: e.target.value })} /></label>
          <label className="formField"><span>Nr. RECOPI</span><input value={fiscal.recopi} onChange={e => setFiscal({ ...fiscal, recopi: e.target.value })} /></label>
          <label className="formField"><span>EX TIPI</span><input value={fiscal.exTipi} onChange={e => setFiscal({ ...fiscal, exTipi: e.target.value })} /></label>
          <label className="formField"><span>Nr. de controle da FCI</span><input value={fiscal.fci} onChange={e => setFiscal({ ...fiscal, fci: e.target.value })} /></label>
          <label className="formField"><span>Informações adicionais</span><input value={fiscal.infoAdicional} onChange={e => setFiscal({ ...fiscal, infoAdicional: e.target.value })} /></label>
        </div>
        <label className="toggleLine"><input type="checkbox" checked={fiscal.agrupavel} onChange={e => setFiscal({ ...fiscal, agrupavel: e.target.checked })} /><span>Produto é um item agrupável</span></label>
        <p className="helpText">Esses campos ficam salvos neste painel. A sincronização fiscal será ligada apenas aos campos que a Open Platform disponibilizar para a sua categoria/permissão.</p>
      </section>

      <section ref={sections.shipping} className="editorSection">
        <div className="sectionHeading"><div><h2>Envio</h2><p>Peso, dimensões e canais logísticos.</p></div></div>
        <label className="toggleLine"><input type="checkbox" checked={differentDimensions} onChange={e => setDifferentDimensions(e.target.checked)} /><span>Pesos/dimensões diferentes por variação</span></label>
        <div className="formGrid four">
          <label className="formField"><span>Peso (kg)</span><input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label className="formField"><span>Comprimento (cm)</span><input type="number" value={length} onChange={e => setLength(e.target.value)} /></label>
          <label className="formField"><span>Largura (cm)</span><input type="number" value={width} onChange={e => setWidth(e.target.value)} /></label>
          <label className="formField"><span>Altura (cm)</span><input type="number" value={height} onChange={e => setHeight(e.target.value)} /></label>
        </div>
        <h3 className="subheading">Canais de envio</h3>
        {logistics.length ? logistics.map((row, index) => (
          <div className="shippingRow" key={row.logisticId}>
            <div><strong>{row.name}</strong><small>ID {row.logisticId}</small></div>
            <label className="shippingFee"><span>Taxa</span><input type="number" step="0.01" value={row.shippingFee} onChange={e => setLogistics(current => current.map((value, i) => i === index ? { ...value, shippingFee: e.target.value } : value))} /></label>
            <label className="switch"><input type="checkbox" checked={row.enabled} onChange={e => setLogistics(current => current.map((value, i) => i === index ? { ...value, enabled: e.target.checked } : value))} /><span /></label>
          </div>
        )) : <div className="subtlePanel">Os canais logísticos aparecerão aqui quando a API da loja retornar a lista.</div>}
      </section>

      <section ref={sections.others} className="editorSection">
        <div className="sectionHeading"><div><h2>Outros</h2><p>Promoção, condição, agendamento e SKU principal.</p></div></div>
        <div className="formGrid two">
          <label className="formField"><span>Promoção atual</span><input value={promotion} onChange={e => setPromotion(e.target.value)} placeholder="Nenhuma" /></label>
          <label className="formField"><span>Condição</span><select value={condition} onChange={e => setCondition(e.target.value)}><option value="NEW">Novo</option><option value="USED">Usado</option></select></label>
          <label className="formField"><span>Agendar publicação</span><input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} /></label>
          <label className="formField"><span>SKU principal</span><input value={itemSku} onChange={e => setItemSku(e.target.value)} /></label>
        </div>
      </section>

      <div className="editorFooter">
        <Link href="/products" className="outlineButton">Cancelar</Link>
        <button className="outlineButton" onClick={() => toggleListing(true)} disabled={saving}>Desativar</button>
        <button className="primaryButton compact" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Atualizar'}</button>
      </div>
    </main>
  )
}
