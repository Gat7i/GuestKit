import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentHotelServer } from '@/lib/hotel-server'

export async function generateMetadata(): Promise<Metadata> {
  const hotel = await getCurrentHotelServer()
  return {
    title: `Conditions générales d'utilisation — ${hotel?.name || 'GuestsKit'}`,
    description: "Conditions d'utilisation de l'application GuestsKit pour les clients de l'hôtel.",
  }
}

export default async function CguPage() {
  const hotel = await getCurrentHotelServer()
  const hotelName = hotel?.name || 'l\'hôtel'
  const hotelAddress = hotel?.address
  const legalEntity = hotel?.legal_name
  const legalForm = hotel?.legal_form
  const country = hotel?.country
  const registrationNumber = hotel?.registration_number
  const legalRepresentative = hotel?.legal_representative
  const dataProtectionOfficer = hotel?.data_protection_officer
  const dataProtectionEmail = hotel?.data_protection_email
  const legalJurisdiction = hotel?.legal_jurisdiction
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition">
          ← Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions générales d'utilisation</h1>
            <p className="text-sm text-gray-500">Dernière mise à jour : novembre 2026</p>
          </div>

          <Section title="1. Objet">
            <p>
              Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation
              de l'application GuestsKit, mise à disposition des clients de{' '}
              <strong>{hotelName}</strong>{hotelAddress && ` (${hotelAddress})`} pendant
              la durée de leur séjour.
            </p>
            {legalEntity && (
              <p className="mt-2">
                L'établissement est exploité par <strong>{legalEntity}</strong>
                {legalForm && `, ${legalForm}`}
                {registrationNumber && `, immatriculé sous le n° ${registrationNumber}`}
                {country && `, ${country}`}.
              </p>
            )}
            <p className="mt-2 text-sm">
              L'application est éditée et hébergée par <strong>GuestsKit</strong>, prestataire
              technique de l'hôtel.
            </p>
          </Section>

          <Section title="2. Accès à l'application">
            <p>
              L'application est accessible exclusivement aux clients de l'hôtel disposant d'un compte
              créé avec leur adresse e-mail. L'accès est activé à l'enregistrement (check-in) et
              désactivé après le départ (check-out).
            </p>
            <p>
              Chaque client est responsable de la confidentialité de ses identifiants de connexion.
            </p>
          </Section>

          <Section title="3. Services proposés">
            <p>L'application GuestsKit permet aux clients de :</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>Consulter les informations de l'hôtel (restaurants, activités, spectacles, carte)</li>
              <li>Effectuer des demandes de service (room service, conciergerie, etc.)</li>
              <li>Suivre l'état de leurs demandes et échanges avec l'équipe</li>
              <li>Communiquer avec l'équipe de l'hôtel</li>
              <li>Explorer les suggestions de découvertes locales</li>
            </ul>
          </Section>

          <Section title="4. Comportement de l'utilisateur">
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>Fournir des informations exactes lors de la création de son compte</li>
              <li>Ne pas utiliser l'application à des fins illicites ou abusives</li>
              <li>Ne pas tenter d'accéder aux données d'autres clients</li>
              <li>Formuler des demandes de service raisonnables et en rapport avec son séjour</li>
            </ul>
          </Section>

          <Section title="5. Disponibilité du service">
            <p>
              L'hôtel s'efforce d'assurer la disponibilité de l'application 24h/24, 7j/7. Des
              interruptions temporaires peuvent survenir pour maintenance ou en cas d'incident technique.
              L'hôtel ne peut être tenu responsable des conséquences d'une indisponibilité momentanée.
            </p>
          </Section>

          <Section title="6. Propriété intellectuelle">
            <p>
              L'ensemble du contenu de l'application (textes, photos, logos, interface) est la propriété
              exclusive de <strong>{hotelName}</strong> ou de ses partenaires.
              Toute reproduction sans autorisation est interdite.
            </p>
          </Section>

          <Section title="7. Données personnelles">
            <p>
              La collecte et le traitement de vos données personnelles sont détaillés dans notre{' '}
              <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
                politique de confidentialité
              </Link>
              , conformément à la loi organique tunisienne n° 2004-63 relative à la protection
              des données à caractère personnel.
            </p>
          </Section>

          <Section title="8. Limitation de responsabilité">
            <p>
              L'application est un outil de communication et d'information. L'hôtel ne peut garantir
              que toutes les demandes de service soient traitées dans un délai précis, notamment en
              cas de forte affluence. Les informations affichées (horaires, menus, activités) peuvent
              être modifiées sans préavis.
            </p>
          </Section>

          <Section title="9. Droit applicable">
            <p>
              Les présentes CGU sont soumises au droit tunisien. En cas de litige non résolu
              à l'amiable, les tribunaux{legalJurisdiction ? ` de ${legalJurisdiction}` : ' compétents'} seront saisis.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question, contactez la réception de l'hôtel ou écrivez-nous via votre
              espace personnel dans l'application.
              {legalRepresentative && <> Responsable légal : <strong>{legalRepresentative}</strong>.</>}
              {dataProtectionOfficer && <> Délégué à la protection des données : <strong>{dataProtectionOfficer}</strong>
                {dataProtectionEmail && <> (<a href={`mailto:${dataProtectionEmail}`} className="text-blue-600 hover:underline">{dataProtectionEmail}</a>)</>}.
              </>}
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
