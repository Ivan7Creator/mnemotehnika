import {
  handleRandomAttentionImageRequest,
  nodeRequestToWebRequest,
  sendWebResponseToNode,
} from "../lib/attention-api.js";

export default async function handler(req, res) {
  const response = await handleRandomAttentionImageRequest(nodeRequestToWebRequest(req, getBaseUrl(req)));
  await sendWebResponseToNode(res, response);
}

function getBaseUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}
