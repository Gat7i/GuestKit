import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { getCurrentHotelServer } from "@/lib/hotel-server";

export async function generateMetadata(): Promise<Metadata> {
  const hotel = await getCurrentHotelServer();
  return {
    title: `Politique de confidentialité — ${hotel?.name || "GuestsKit"}`,
    description:
      "Comment nous collectons, utilisons et protégeons vos données personnelles.",
  };
}

export default async function PolitiqueConfidentialitePage() {
  const hotel = await getCurrentHotelServer();
  const contactEmail = hotel?.data_protection_email || hotel?.email;
  const dpo = hotel?.data_protection_officer;
  const legalEntity = hotel?.legal_name;
  const legalForm = hotel?.legal_form;
  const country = hotel?.country;
  const registrationNumber = hotel?.registration_number;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition"
        >
          ← Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Politique de confidentialité
            </h1>
            <p className="text-sm text-gray-500">
              Dernière mise à jour : novembre 2026
            </p>
          </div>

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées
              via cette application est :
            </p>
            <p className="mt-3 font-medium text-gray-800">
              {legalEntity ? (
                <>
                  {legalEntity}
                  {legalForm && `, ${legalForm}`}
                  {country && `, ${country}`}
                  {registrationNumber && (
                    <>
                      <br />
                      <span className="font-normal text-sm">
                        N° d'immatriculation : {registrationNumber}
                      </span>
                    </>
                  )}
                </>
              ) : (
                hotel?.name || "l'hôtel"
              )}
              <br />
              {hotel?.address && (
                <span className="font-normal">
                  {hotel.address}
                  <br />
                </span>
              )}
              {dpo && (
                <>
                  <span className="font-normal">DPO : {dpo}</span>
                  <br />
                </>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-blue-600 hover:underline font-normal"
                >
                  {contactEmail}
                </a>
              )}
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>
              Nous collectons uniquement les données nécessaires à la gestion de
              votre séjour :
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>Adresse e-mail (lors de la création de votre compte)</li>
              <li>Nom et prénom (renseignés dans votre profil)</li>
              <li>Numéro de chambre et dates de séjour</li>
              <li>Demandes de service effectuées durant le séjour</li>
              <li>
                Données de connexion (adresse IP, horodatage — via Supabase
                Auth)
              </li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>
                Authentification et accès sécurisé à votre espace personnel
              </li>
              <li>Gestion de votre séjour (check-in, chambre, demandes)</li>
              <li>Communication entre vous et l'équipe de l'hôtel</li>
              <li>Amélioration de nos services</li>
            </ul>
          </Section>

          <Section title="4. Base légale">
            <p>
              Le traitement est fondé sur l'exécution du contrat d'hébergement
              et votre consentement explicite lors de la création de votre
              compte, conformément à la loi organique tunisienne n° 2004-63 du
              27 juillet 2004 relative à la protection des données à caractère
              personnel.
            </p>
          </Section>

          <Section title="5. Durée de conservation">
            <p>
              Vos données sont conservées pendant la durée de votre séjour et
              jusqu'à 12 mois après votre départ, pour des raisons de service
              après-vente. Vous pouvez demander leur suppression à tout moment
              (voir article 7).
            </p>
          </Section>

          <Section title="6. Partage des données">
            <p>
              Vos données ne sont jamais vendues ni transmises à des tiers à des
              fins commerciales. Elles sont uniquement partagées avec :
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>
                <strong>GuestsKit</strong> (prestataire technique, éditeur de
                l'application)
              </li>
              <li>
                <strong>Supabase</strong> (base de données et authentification —
                serveurs us-east-2, États-Unis)
              </li>
              <li>
                <strong>Cloudinary</strong> (hébergement des photos)
              </li>
              <li>
                <strong>Vercel</strong> (hébergement de l'application)
              </li>
            </ul>
          </Section>

          <Section title="7. Vos droits">
            <p>
              Conformément à la loi organique tunisienne n° 2004-63, vous
              disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
              <li>
                <strong>Droit d'accès</strong> — obtenir une copie de vos
                données
              </li>
              <li>
                <strong>Droit de rectification</strong> — corriger des données
                inexactes
              </li>
              <li>
                <strong>Droit d'effacement</strong> — demander la suppression de
                votre compte
              </li>
              <li>
                <strong>Droit d'opposition</strong> — vous opposer à certains
                traitements
              </li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à la réception ou par
              e-mail depuis votre espace personnel.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Cette application utilise des cookies strictement nécessaires au
              fonctionnement de l'authentification (cookies de session
              Supabase). Aucun cookie publicitaire ou de tracking tiers n'est
              utilisé.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Pour toute question relative à vos données personnelles,
              adressez-vous à la réception de l'hôtel
              {contactEmail && (
                <>
                  {" "}
                  ou écrivez-nous à{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {contactEmail}
                  </a>
                </>
              )}
              . Consultez également nos{" "}
              <Link href="/cgu" className="text-blue-600 hover:underline">
                conditions générales d'utilisation
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
