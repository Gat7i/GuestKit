import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentHotelServer } from '@/lib/hotel-server'
import React from 'react'

export async function generateMetadata(): Promise<Metadata> {
  const hotel = await getCurrentHotelServer()
  return {
    title: `Politique de confidentialité — ${hotel?.name || 'GuestsKit'}`,
    description: 'Comment nous collectons, utilisons et protégeons vos données personnelles.',
  }
}

export default async function PolitiqueConfidentialitePage() {
  const hotel = await getCurrentHotelServer()
  const contactEmail = hotel?.email || hotel?.name

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition">
          ← Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour : novembre 2026</p>
          </div>

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées via cette application est :
            </p>
            <p className="mt-3 font-medium text-gray-800">
              {hotel?.name || 'The Orangers Beach Resort & Bungalows'}<br />
              {hotel?.address && <>{hotel.address}<br /></>}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline font-normal">
                  {contactEmail}
                </a>
              )}
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>Nous collectons uniquement les données nécessaires à la gestion de votre séjour :</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>Adresse e-mail (lors de la création de votre compte)</li>
              <li>Nom et prénom (renseignés dans votre profil)</li>
              <li>Numéro de chambre et dates de séjour</li>
              <li>Demandes de service effectuées durant le séjour</li>
              <li>Données de connexion (adresse IP, horodatage — via Supabase Auth)</li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Authentification et accès sécurisé à votre espace personnel</li>
              <li>Gestion de votre séjour (check-in, chambre, demandes)</li>
              <li>Communication entre vous et l'équipe de l'hôtel</li>
              <li>Amélioration de nos services</li>
            </ul>
          </Section>

          <Section title="4. Base légale">
            <p>
              Le traitement est fondé sur l'exécution du contrat d'hébergement (gestion du séjour)
              et votre consentement explicite lors de la création de votre compte.
              La base légale applicable (réglementation locale ou européenne) sera précisée
              dans une prochaine mise à jour après validation juridique.
            </p>
          </Section>

          <Section title="5. Durée de conservation">
            <p>
              Vos données sont conservées pendant la durée de votre séjour et jusqu'à 12 mois après
              votre départ, pour des raisons de service après-vente. Vous pouvez demander leur
              suppression à tout moment (voir article 7).
            </p>
          </Section>

          <Section title="6. Partage des données">
            <p>
              Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales.
              Elles sont uniquement partagées avec :
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li><strong>GuestsKit</strong> (prestataire technique, éditeur de l'application)</li>
              <li><strong>Supabase</strong> (base de données et authentification)</li>
              <li><strong>Cloudinary</strong> (hébergement des photos)</li>
              <li><strong>Vercel</strong> (hébergement de l'application)</li>
            </ul>
          </Section>

          <Section title="7. Vos droits (RGPD)">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> — vous opposer à certains traitements</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à la réception ou par e-mail depuis votre
              espace personnel.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Cette application utilise des cookies strictement nécessaires au fonctionnement de
              l'authentification (cookies de session Supabase). Aucun cookie publicitaire ou de
              tracking tiers n'est utilisé.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Pour toute question relative à vos données personnelles, adressez-vous à la réception
              de l'hôtel{contactEmail && (
                <> ou écrivez-nous à{' '}
                  <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                    {contactEmail}
                  </a>
                </>
              )}. Consultez également nos{' '}
              <Link href="/cgu" className="text-blue-600 hover:underline">conditions générales d'utilisation</Link>.
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
