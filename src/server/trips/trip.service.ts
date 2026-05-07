import {
  createTripGraph,
  listTrips,
} from "./trip.repository";
import { mapTripDetail, mapTripListItem } from "./trip.mapper";
import type { CreateTripInput } from "./trip.schema";

export async function createTrip(input: CreateTripInput) {
  const trip = await createTripGraph(input);
  return mapTripDetail(trip);
}

export async function getTripList() {
  const trips = await listTrips();
  return trips.map(mapTripListItem);
}
