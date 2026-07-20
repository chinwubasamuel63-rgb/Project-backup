export const purchaseSuccessfulEmail = (productTitle) => `
  <h2>Purchase Successful</h2>

  <p>
    You now own:
  </p>

  <p>
    <strong>${productTitle}</strong>
  </p>

  <p>
    Thank you for your purchase.
  </p>
`;

export const productSoldEmail = (productTitle, amount) => `
  <h2>New Product Sale</h2>

  <p>
    Your product has been purchased.
  </p>

  <p>
    <strong>${productTitle}</strong>
  </p>

  <p>
    Sale Amount: ₦${amount}
  </p>
`;
