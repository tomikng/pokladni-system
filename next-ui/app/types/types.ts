import { ApiTypes } from "./api";

export interface EditableProduct extends ApiTypes.Product {
  import_price: number;
  buy_price?: number;
  sell_price?: number;
  count?: number;
  margin?: number;
  key: React.Key;
}

export class ImportValues {
  supplier?: number;
  products!: EditableProduct[];
  ico?: string;
  note?: string;
  invoice_number?: string;
  pdf?: any;
}
