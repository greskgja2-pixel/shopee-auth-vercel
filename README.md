# Shopee Auth Vercel

Aplicação Next.js para conectar uma loja Shopee pela Shopee Open Platform, com deploy na Vercel.

## Variáveis de ambiente

Configure na Vercel:

- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_REDIRECT_URL`
- `SHOPEE_AUTH_HOST=https://partner.shopeemobile.com`
- `SESSION_SECRET` — use uma string aleatória longa
- `NEXT_PUBLIC_APP_URL` — URL pública da aplicação, por exemplo `https://seu-projeto.vercel.app`

O callback deve ser:

`https://SEU-DOMINIO/api/shopee/callback`

Cadastre exatamente a mesma URL na Shopee Open Platform.

## Segurança

A Partner Key nunca é enviada ao navegador. O access token e o refresh token são colocados em uma sessão assinada e armazenada em cookie HTTP-only e Secure.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Produção

Importe este repositório na Vercel, configure as variáveis e faça o deploy.
