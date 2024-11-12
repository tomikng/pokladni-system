import React, { forwardRef } from "react";
import { formatCurrency } from "@/app/lib/helpers/formatCurrency";
import { ApiTypes } from "@/app/types/api";
import BusinessSettings = ApiTypes.BusinessSettings;
import SaleDetails = ApiTypes.SaleDetails;

interface ReceiptContentProps {
  saleDetails: SaleDetails;
  businessSettings: BusinessSettings;
}

const ReceiptContent = forwardRef<HTMLDivElement, ReceiptContentProps>(
  ({ saleDetails, businessSettings }, ref) => {
    const { selectedProducts, totalDue, received, changeDue, currency } =
      saleDetails;

    const calculateTaxAmount = (price: number, taxRate: number) => {
      return price * (taxRate / 100);
    };

    const taxGroups = selectedProducts.reduce(
      (acc, item) => {
        const taxRate = item.product.tax_rate * 100; // Convert to percentage
        const price = item.product.price_with_vat * item.quantity;
        const taxAmount = calculateTaxAmount(
          price,
          item.product.tax_rate * 100,
        ); // Calculate correctly
        if (!acc[taxRate]) {
          acc[taxRate] = { price: 0, taxAmount: 0 };
        }
        acc[taxRate].price += price;
        acc[taxRate].taxAmount += taxAmount;
        return acc;
      },
      {} as Record<number, { price: number; taxAmount: number }>,
    );

    return (
      <div
        ref={ref}
        style={{
          width: "80mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          padding: "5mm",
        }}
      >
        <h2 style={{ textAlign: "center", margin: "0" }}>Účtenka</h2>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <p style={{ margin: "0", fontSize: "10px" }}>
            <strong>{businessSettings.business_name}</strong>
            <br />
            IČO: {businessSettings.ico}
            <br />
            DIČ: {businessSettings.dic}
            <br />
            {businessSettings.address}
            <br />
            Email: {businessSettings.contact_email}
            <br />
            Telefon: {businessSettings.contact_phone}
          </p>
        </div>
        <div style={{ borderTop: "1px solid black", margin: "10px 0" }}></div>
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid black" }}
                >
                  Produkt
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  Množství
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  Cena
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  DPH
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((item) => (
                <tr key={item.product.id}>
                  <td style={{ textAlign: "left" }}>{item.product.name}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(
                      item.product.price_with_vat * item.quantity,
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {item.product.tax_rate * 100}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: "1px solid black", margin: "10px 0" }}></div>
        <div style={{ fontSize: "10px" }}>
          <p style={{ margin: "0" }}>Celkem: {formatCurrency(totalDue)}</p>
          {received !== undefined && (
            <p style={{ margin: "0" }}>Přijato: {formatCurrency(received)}</p>
          )}
          {changeDue !== undefined && (
            <p style={{ margin: "0" }}>Vráceno: {formatCurrency(changeDue)}</p>
          )}
          {currency && <p style={{ margin: "0" }}>Měna: {currency}</p>}
        </div>
        <div style={{ borderTop: "1px solid black", margin: "10px 0" }}></div>
        <div style={{ fontSize: "10px" }}>
          <h3>DPH</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", borderBottom: "1px solid black" }}
                >
                  Sazba
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  Základ daně
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  Daň
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid black",
                  }}
                >
                  Celkem
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(taxGroups).map(
                ([taxRate, { price, taxAmount }]) => (
                  <tr key={taxRate}>
                    <td style={{ textAlign: "left" }}>{taxRate}%</td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(price - taxAmount)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(taxAmount)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {formatCurrency(price)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: "1px solid black", margin: "10px 0" }}></div>
        <p style={{ textAlign: "center", margin: "10px 0", fontSize: "10px" }}>
          Děkujeme za váš nákup!
        </p>
      </div>
    );
  },
);

ReceiptContent.displayName = "ReceiptContent";

export default ReceiptContent;
