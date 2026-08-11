import ProductEditor from './product-editor'

export default function ProductPage({ params }: { params: { itemId: string } }) {
  return <ProductEditor itemId={params.itemId} />
}
