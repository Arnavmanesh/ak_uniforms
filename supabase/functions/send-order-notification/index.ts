import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderNotification {
  orderId: string;
  customer: {
    fullName: string;
    phoneNumber: string;
    department: string;
    year: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
    price_per_unit: number;
  }>;
  total: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: OrderNotification = await req.json();
    const { orderId, customer, items, total } = body;

    // Log order for debugging - can be viewed in Supabase logs
    console.log("New Order Received:", {
      orderId,
      customer,
      items,
      total,
      timestamp: new Date().toISOString(),
    });

    // If RESEND_API_KEY is configured, send email notification
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL");

    if (resendApiKey && notificationEmail) {
      const emailContent = `
        <h2>New Order Received - ${orderId}</h2>
        <h3>Customer Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${customer.fullName}</li>
          <li><strong>Phone:</strong> ${customer.phoneNumber}</li>
          <li><strong>Department:</strong> ${customer.department}</li>
          <li><strong>Year:</strong> ${customer.year}</li>
        </ul>
        <h3>Order Items:</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Product</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Qty</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Price</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.product_name}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${item.price_per_unit}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${item.quantity * item.price_per_unit}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f3f4f6; font-weight: bold;">
              <td colspan="3" style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Grand Total:</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${total}</td>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top: 20px; color: #666;">
          <strong>Payment Method:</strong> Cash on Delivery<br>
          <strong>Order ID:</strong> ${orderId}
        </p>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AK Uniforms <noreply@akuniforms.com>",
          to: notificationEmail,
          subject: `New Order: ${orderId} - ₹${total}`,
          html: emailContent,
        }),
      });
    }

    // If GOOGLE_SHEETS_WEBHOOK_URL is configured, sync to Google Sheets
    const googleSheetsWebhook = Deno.env.get("GOOGLE_SHEETS_WEBHOOK_URL");
    if (googleSheetsWebhook) {
      await fetch(googleSheetsWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerName: customer.fullName,
          phone: customer.phoneNumber,
          department: customer.department,
          year: customer.year,
          items: items.map(i => `${i.product_name} (${i.quantity})`).join(", "),
          total,
          status: "Order Received",
          timestamp: new Date().toISOString(),
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order notification processed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
