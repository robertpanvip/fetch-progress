async function main() {
    const blob = new Blob([new Uint8Array(10 * 1024 * 1024)]); // any Blob, including a File
    const uploadProgress = document.getElementById("upload-progress");
    const downloadProgress = document.getElementById("download-progress");
  
    const totalBytes = blob.size;
    let bytesUploaded = 0;
  
    // Use a custom TransformStream to track upload progress
    const progressTrackingStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        bytesUploaded += chunk.byteLength;
        console.log("upload progress:", bytesUploaded / totalBytes);
        uploadProgress.value = bytesUploaded / totalBytes;
      },
      flush(controller) {
        console.log("completed stream");
      },
    });
    const response = await fetch("https://httpbin.org/put", {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream"
      },
      body: blob.stream().pipeThrough(progressTrackingStream),
      duplex: "half",
    });
    
    // After the initial response headers have been received, display download progress for the response body
    let success = true;
    const totalDownloadBytes = response.headers.get("content-length");
    let bytesDownloaded = 0;
    const reader = response.body.getReader();
    while (true) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        bytesDownloaded += value.length;
        if (totalDownloadBytes != undefined) {
          console.log("download progress:", bytesDownloaded / totalDownloadBytes);
          downloadProgress.value = bytesDownloaded / totalDownloadBytes;
        } else {
          console.log("download progress:", bytesDownloaded, ", unknown total");
        }
      } catch (error) {
        console.error("error:", error);
        success = false;
        break;
      }
    }
    
    console.log("success:", success);
  }
  main().catch(console.error);
