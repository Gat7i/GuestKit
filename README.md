# GuestsKit — Application hôtelière

Application SaaS de gestion de l'expérience client hôtelière (guests au pluriel).

**Stack :** Next.js App Router · Supabase · Cloudinary · TailwindCSS 4 · Vercel

**Déploiement demo :** [www.guestskit.app](https://www.guestskit.app) — The Orangers Beach Resort

## Documentation

Voir `CLAUDE.md` pour l'architecture, les règles RLS, la charte graphique et la coordination multi-agents.

## Développement local

```bash
npm install
npm run dev
```

Copier `.env.local.example` → `.env.local` et renseigner les variables Supabase, Cloudinary et `NEXT_PUBLIC_HOTEL_ID`.
