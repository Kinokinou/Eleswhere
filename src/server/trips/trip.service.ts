import {
  createTripGraph,
  deleteTrip,
  getTripById,
  listTrips,
  updateTrip,
} from "./trip.repository";
import { mapTripDetail, mapTripListItem } from "./trip.mapper";
import { deleteUploadFile } from "@/server/uploads/upload.repository";
import type { CreateTripInput, UpdateTripInput } from "./trip.schema";

export async function createTrip(input: CreateTripInput) {
  const trip = await createTripGraph(input);
  return mapTripDetail(trip);
}

export async function getTripList() {
  const trips = await listTrips();
  return trips.map(mapTripListItem);
}

export async function getTripDetail(id: string) {
  const trip = await getTripById(id);
  return trip ? mapTripDetail(trip) : null;
}

export async function editTrip(id: string, input: UpdateTripInput) {
  const trip = await updateTrip(id, input);
  return trip ? mapTripDetail(trip) : null;
}

export async function removeTrip(id: string) {
  const deletedTrip = await deleteTrip(id);

  for (const photo of deletedTrip.photos) {
    try {
      await deleteUploadFile(photo.storagePath);
    } catch (error) {
      // 关键逻辑：图片清理失败不回滚数据库删除，只记录 warning 方便后续排查。
      console.warn("删除本地图片失败", {
        photoId: photo.id,
        storagePath: photo.storagePath,
        error,
      });
    }
  }

  return { success: true };
}
