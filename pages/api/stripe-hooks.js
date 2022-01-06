import initStripe from "stripe";
import { buffer } from "micro";
import { getServiceSupabase } from "../../utils/supabase";

export const config = { api: { bodyParser: false } };

const handler = async (req, res) => {
  const stripe = initStripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers["stripe-signature"];
  const signingSelect = process.env.STRIPE_SIGNING_SELECT;
  const reqBuffer = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(reqBuffer, signature, signingSelect);
  } catch (error) {
    console.log(error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  const supabase = getServiceSupabase();

  switch (event.type) {
    case 'customer.subscription.created':
        await supabase.from('profile').update({
          is_subscribed: true,
        }).eq("stripe_customer", event.data.object.customer);
  }

  console.log("event received");

  res.send({ received: true });
};

export default handler;