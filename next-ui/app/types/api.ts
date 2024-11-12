export type RegistrationBody = {
  username: string;
  email?: string;
  password: string;
  password2: string;
  role?: string;
  first_name?: string;
  last_name?: string;
};

export class CustomUser {
  id!: number;
  name!: string;
  email?: string;
  role!: string;
  accessTokenExpires!: string;
  access!: string;
  refresh!: string;
  is_active?: boolean;
}

export type CustomSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    id?: number | null;
  } | null;
  refreshTokenExpires?: number;
  accessTokenExpires?: number;
  access?: string | null;
  refresh?: string | null;
} | null;

export namespace ApiTypes {
  export class Category {
    id!: number;
    name!: string;
    parent?: Category | number;
    children?: Category[];
  }

  export class Product {
    id!: number;
    name!: string;
    description?: string;
    price!: number;
    // Note that the main category is accessed by index 0
    categories!: Category[];
    category!: Category;
    image?: string;
    color?: string;
    tax_rate!: number;
    ean_code!: string;
    unit!: string;
    price_with_vat!: number;
    price_without_vat!: number;
    measurement_of_quantity!: number;
    inventory_count!: number;

    discount?: number | string;
  }

  export class TaxRate {
    value!: number;
    label!: string;
  }

  export class QuickSale {
    id!: number;
    ean!: string;
    name!: string;
    tax_rate!: number;
    price_with_vat!: number;
    quantity!: number;
    date_sold!: string;
  }

  export class Supplier {
    id!: number;
    name!: string;
    phone_number?: string;
    email?: string;
    address?: string;
    ico?: string;
    dic?: string;
    date_created!: string;
    date_updated!: string;
  }

  export class ProductImport {
    product_id!: number;
    quantity!: number;
    price_with_vat!: number;
    import_price!: number;
  }

  export class CreateStockImport {
    supplier?: number;
    products!: ProductImport[];
    ico?: string;
    note?: string;
    invoice_number?: string;
    invoice_pdf?: string | File;
  }

  export class StockImport extends CreateStockImport {
    id!: number;
    stock_entries!: StockEntry[];
    date_created!: string;
  }

  export interface StockEntry {
    id: number;
    product: Product;
    supplier: Supplier | null;
    quantity: number;
    movement_type: "IN" | "OUT";
    import_price: string;
    date_created: string;
    date_updated: string;
  }

  export interface CreateSaleItem {
    product_id: number;
    quantity: number;
    price: number;
  }

  export interface CreateSalePayment {
    payment_type: string;
  }

  export interface CreateSale {
    cashier: number;
    total_amount: number;
    items: CreateSaleItem[];
    payment: CreateSalePayment;
    voucher_id?: number;
  }

  export interface Sale {
    id: string;
    cashier: string;
    total_amount: number;
    date_created: string;
  }

  export interface BusinessSettings {
    business_name: string;
    ico: string;
    dic: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    euro_rate: number;
    default_tax_rate: string;
    id: number;
  }

  export interface Voucher {
    id: number;
    ean_code: string;
    title: string;
    expiration_date: string;
    discount_type: "Percentage" | "Fixed";
    discount_amount: number;
    is_active: boolean;
    description?: string;
  }

  export interface SaleDetails {
    selectedProducts: {
      product: ApiTypes.Product;
      quantity: number;
    }[];
    totalDue: number;
    received?: number;
    changeDue?: number;
    currency?: string;
  }

  export type SaleStatistics = {
    period: string;
    start_date: string;
    end_date: string;
    total_sales: number;
    total_sales_without_vat: number;
    transaction_count: number;
    average_transaction_value: number;
    prev_total_sales: number;
    prev_total_sales_without_vat: number;
    prev_transaction_count: number;
    prev_average_transaction_value: number;
    top_selling_products: TopSellingProduct[];
    sales_by_category: SalesByCategory[];
    sales_by_tax_rate: SalesByTaxRate[];
    interval_data: IntervalData[];
    table_interval_data: TableIntervalData[];
    customRangeData?: IntervalData[];
  };

  export type TopSellingProduct = {
    product__name: string;
    total_quantity: number;
  };

  export type SalesByCategory = {
    product__category__name: string;
    total_sales: number;
  };

  export type SalesByTaxRate = {
    product__tax_rate: number;
    total_sales: number;
    total_quantity: number;
    transaction_count: number;
  };

  export type IntervalData = {
    interval_range: string;
    tax_rate_data: {
      product__tax_rate: number;
      total_sales: number;
      total_quantity: number;
      transaction_count: number;
      vat_amount: number;
    }[];
  };

  export type TableIntervalData = {
    hour?: string;
    day?: string;
    week_range?: string;
    month?: string;
    product__tax_rate: number;
    transaction_count: number;
    total_sales: number;
  };

  export interface DailySummary {
    date: string;
    total_sales: number;
    total_cash: number;
    total_card: number;
    total_tips: number;
    cash_difference: number;
    closing_cash: number;
  }

  export interface CreateDailySummary {
    actual_cash: number;
  }

  export interface Withdrawal {
    amount: number;
    note?: string;
  }

  export interface CreateWithdrawal {
    amount: number;
    note?: string;
  }
}
