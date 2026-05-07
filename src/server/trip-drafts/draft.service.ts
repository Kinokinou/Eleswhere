import { deleteUploadFile } from "@/server/uploads/upload.repository";
import { saveUploadedPhoto } from "@/server/uploads/upload.service";
import {
  addDraftPhotos,
  createDraft,
  deleteDraft,
  getDraftById,
  listDrafts,
  updateDraft,
  type DraftPhotoCreateInput,
} from "./draft.repository";
import { mapDraft } from "./draft.mapper";
import type {
  CreateTripDraftInput,
  DraftPhotoMetaInput,
  UpdateTripDraftInput,
} from "./draft.schema";

export async function createTripDraft(input: CreateTripDraftInput) {
  const draft = await createDraft(input);
  return mapDraft(draft);
}

export async function getTripDraftList() {
  const drafts = await listDrafts();
  return drafts.map(mapDraft);
}

export async function getTripDraftDetail(id: string) {
  const draft = await getDraftById(id);
  return draft ? mapDraft(draft) : null;
}

export async function editTripDraft(id: string, input: UpdateTripDraftInput) {
  const draft = await updateDraft(id, input);
  return mapDraft(draft);
}

export async function removeTripDraft(id: string) {
  const deleted = await deleteDraft(id);

  for (const photo of deleted.photos) {
    try {
      await deleteUploadFile(photo.storagePath);
    } catch (error) {
      console.warn("删除草稿本地照片失败", {
        draftId: id,
        photoId: photo.id,
        storagePath: photo.storagePath,
        error,
      });
    }
  }

  return { success: true };
}

export async function uploadDraftPhotos(input: {
  draftId: string;
  files: File[];
  clientIds: string[];
  metadata: DraftPhotoMetaInput[];
}) {
  const savedPhotos: DraftPhotoCreateInput[] = [];
  const metadataByClientId = new Map(input.metadata.map((item) => [item.clientId, item]));

  for (const [index, file] of input.files.entries()) {
    const clientId = input.clientIds[index] || crypto.randomUUID();
    const meta = metadataByClientId.get(clientId);
    if (!meta) {
      throw new Error(`缺少照片 ${clientId} 的草稿元数据`);
    }

    const saved = await saveUploadedPhoto({ clientId, file });
    savedPhotos.push({
      ...saved,
      takenAt: meta.takenAt,
      lat: meta.lat,
      lng: meta.lng,
      country: meta.country ?? meta.geo?.country,
      province: meta.geo?.province,
      city: meta.geo?.city,
      district: meta.geo?.district,
      township: meta.geo?.township,
      adcode: meta.geo?.adcode,
      poiName: meta.geo?.poiName,
      aoiName: meta.geo?.aoiName,
      placeName: meta.placeName ?? meta.geo?.placeName,
      formattedAddress: meta.geo?.formattedAddress,
      width: meta.width,
      height: meta.height,
      sortOrder: index + 1,
    });
  }

  const draft = await addDraftPhotos(input.draftId, savedPhotos);
  if (!draft) {
    throw new Error("草稿不存在");
  }

  return mapDraft(draft);
}
