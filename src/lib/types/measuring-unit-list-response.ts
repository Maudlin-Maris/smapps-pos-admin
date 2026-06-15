import { Meta } from "./paginated-response";
import { MeasuringUnit } from "./measuring-unit";

export interface MeasuringUnitListResponse {
  data: MeasuringUnit[];
  meta: Meta;
}
