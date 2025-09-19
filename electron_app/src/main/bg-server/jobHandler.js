const axios = require("axios");
const getResponseType = require("./utils/resType");
const { emitJobResponse } = require("./socketClient");
const { logCommon } = require("./utils/logger");

async function handleJob(job) {
  console.log("-> Received job:", job);

  const { requestId, client, streamId, endpoint, method, headers, payload } = job;

  try {
    const axiosConfig = {
      url: endpoint,
      method,
      headers,
      data: payload,
      timeout: 30000,
      httpVersion: "1.1",
    };

    const acceptHeader = headers?.Accept || headers?.accept || "";
    if (acceptHeader.includes("csv") || acceptHeader.includes("zip")) {
      axiosConfig.responseType = "arraybuffer";
    }

    const res = await axios(axiosConfig);
    const contentType = getResponseType(res.headers["content-type"] || "");

    let serializedBody;
    let encoding = "none";

    switch (contentType) {
      case "json":
        serializedBody = res.data;
        encoding = "none";
        break;
      case "csv":
        serializedBody = Buffer.isBuffer(res.data)
          ? res.data.toString("utf8")
          : res.data;
        encoding = "utf8";
        break;
      case "zip":
      case "gz":
        if (!Buffer.isBuffer(res.data)) {
          throw new Error("Expected Buffer for zip/gzip response");
        }
        serializedBody = res.data.toString("base64");
        encoding = "base64";
        break;
      default:
        serializedBody = Buffer.isBuffer(res.data)
          ? res.data.toString("base64")
          : res.data;
        encoding = Buffer.isBuffer(res.data) ? "base64" : "utf8";
      }

      // ✅ Log outgoing request like "common" format
      let contentLength;

      if (typeof serializedBody === "string") {
        // UTF-8 string or base64 string
        contentLength = Buffer.byteLength(serializedBody, "utf8");
      } else if (typeof serializedBody === "object" && serializedBody !== null) {
        // Plain JS object (JSON)
        contentLength = Buffer.byteLength(JSON.stringify(serializedBody), "utf8");
      } else {
        contentLength = 0; // fallback
      }

      logCommon({
        method,
        url: endpoint,
        httpVersion: "1.1",
        status: res.status,
        contentLength
      });

      emitJobResponse({
        requestId,
        streamId,
        clientId: client,
        status: res.status,
        headers: res.headers,
        body: serializedBody,
        encoding,
      contentType,
    });
    
  } catch (err) {
    console.error("-> Error in perform-job:", err.message);

    // ✅ Log failed request in common format (status = 500 if unknown)
    logCommon({
      method,
      url: endpoint,
      httpVersion: "1.1",
      status: err.response?.status || 500,
      contentLength
    });

    const errorResponse = {
      requestId,
      streamId,
      error: err.message,
      code: err.code,
      isAxiosError: err.isAxiosError,
      endpoint,
    };

    if (err.isAxiosError) {
      errorResponse.status = err.response?.status;
      errorResponse.responseData = err.response?.data;
    }

    emitJobResponse(errorResponse);
  }
}

module.exports = handleJob;
