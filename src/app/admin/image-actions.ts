'use server'

import { createAdminClient } from '@/lib/supabase/admin-client'

type BridgeTable = 'entertainment_images' | 'food_spot_images' | 'suggestion_images'

const BRIDGE_FK: Record<BridgeTable, string> = {
  entertainment_images: 'entertainment_id',
  food_spot_images:     'food_spot_id',
  suggestion_images:    'suggestion_id',
}

export async function uploadEntityImage(
  bridgeTable: BridgeTable,
  entityId: number,
  cloudinaryUrl: string,
  altText: string,
  isFirst: boolean
) {
  const supabase = createAdminClient()
  const fkColumn = BRIDGE_FK[bridgeTable]

  // 1. Enregistrer l'image dans la table centrale
  const { data: imageData, error: imageError } = await supabase
    .from('images')
    .insert({ url: cloudinaryUrl, alt_text: altText })
    .select()
    .single()
  if (imageError) throw new Error(imageError.message)

  // 2. Lier à l'entité
  const { error: linkError } = await supabase
    .from(bridgeTable)
    .insert({ [fkColumn]: entityId, image_id: imageData.id, is_principal: isFirst })
  if (linkError) throw new Error(linkError.message)

  return imageData
}

export async function deleteEntityImage(
  bridgeTable: BridgeTable,
  entityId: number,
  imageId: number
) {
  const supabase = createAdminClient()
  const fkColumn = BRIDGE_FK[bridgeTable]

  // Supprimer uniquement le lien — suffisant pour faire disparaître l'image du front
  const { error } = await supabase
    .from(bridgeTable)
    .delete()
    .eq(fkColumn, entityId)
    .eq('image_id', imageId)

  if (error) throw new Error(error.message)
}

export async function setEntityImageAsPrincipal(
  bridgeTable: BridgeTable,
  entityId: number,
  imageId: number
) {
  const supabase = createAdminClient()
  const fkColumn = BRIDGE_FK[bridgeTable]

  await supabase.from(bridgeTable).update({ is_principal: false }).eq(fkColumn, entityId)
  const { error } = await supabase
    .from(bridgeTable)
    .update({ is_principal: true })
    .eq(fkColumn, entityId)
    .eq('image_id', imageId)
  if (error) throw new Error(error.message)
}
