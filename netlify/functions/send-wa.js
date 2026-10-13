// netlify/functions/send-wa.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { target, message } = JSON.parse(event.body);
  const FONNTE_TOKEN = process.env.FONNTE_TOKEN; // diset di Netlify

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": pmkLsmLYmrc96WyER6Pb,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ target, message })
    });
    const data = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};