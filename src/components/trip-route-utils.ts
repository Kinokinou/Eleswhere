import type { PhotoMeta, RoutePoint } from "@/lib/trips";

// 关键逻辑：优先选择能在地图上显示的点；没有坐标时退回第一个路线点。
export function getInitialRoutePointId(points: RoutePoint[]) {
  return (
    points.find(
      (point) => typeof point.lat === "number" && typeof point.lng === "number",
    )?.id ?? points[0]?.id
  );
}

// 关键逻辑：路线点只存 photoIds，这里负责补齐照片对象并按拍摄时间排序。
export function getRoutePointPhotos(point: RoutePoint, photos: PhotoMeta[]) {
  return getPhotosByIds(point.photoIds, photos);
}

// 关键逻辑：后端关联表只返回照片 id，前端展示前统一做补齐、过滤和排序。
export function getPhotosByIds(photoIds: string[], photos: PhotoMeta[]) {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));

  return photoIds
    .map((photoId) => photoById.get(photoId))
    .filter((photo): photo is PhotoMeta => Boolean(photo))
    .sort(
      (left, right) =>
        new Date(left.takenAt).getTime() - new Date(right.takenAt).getTime(),
    );
}
