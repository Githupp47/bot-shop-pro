// Shopify Storefront API client - reads real catalog from connected Shopify store
import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "ai-commerce-partner-4o3co.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "f7f2c827b5fddb8d99c0ae214a909d51";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    vendor: string;
    productType: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

export async function storefrontApiRequest(query: string, variables: any = {}) {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 402) {
    toast.error("Shopify: Payment required — please upgrade your Shopify plan.");
    return null;
  }
  if (!res.ok) throw new Error(`Shopify error ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors.map((e: any) => e.message).join(", "));
  return data;
}

export const STOREFRONT_PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          vendor
          productType
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 10) {
            edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } }
          }
          options { name values }
        }
      }
    }
  }
`;

export async function fetchShopifyProducts(first = 50, query?: string): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first, query });
  return data?.data?.products?.edges || [];
}

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

/** Create a Shopify cart for a single variant and return checkout URL (used by AI Bot for "buy now" flows). */
export async function createSingleVariantCheckout(variantId: string, quantity = 1): Promise<string | null> {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity, merchandiseId: variantId }] },
  });
  const errors = data?.data?.cartCreate?.userErrors || [];
  if (errors.length > 0) {
    console.error("cart create errors", errors);
    return null;
  }
  const url = data?.data?.cartCreate?.cart?.checkoutUrl;
  return url ? formatCheckoutUrl(url) : null;
}
