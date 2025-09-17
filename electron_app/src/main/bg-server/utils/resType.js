//content type detection
function getResponseType(contentType = "") {
  const ct = contentType.toLowerCase();

  if (ct.includes("json")) return "json";
  if (ct.includes("csv") || ct.includes("text/csv")) return "csv";
  if (ct.includes("application/zip")) return "zip";
  if (ct.includes("gzip") || ct.includes("application/gzip")) return "gz";

  return "text";
}

module.exports = getResponseType;
