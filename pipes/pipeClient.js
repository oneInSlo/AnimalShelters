import net from "net";

const PIPE_NAME = "\\\\.\\pipe\\animalStatsPipe";

export function sendPipeRequest(data) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ path: PIPE_NAME });
    
    let buffer = "";
    let resolved = false;

    client.on("connect", () => {
      // Write request
      client.write(JSON.stringify(data) + "\n", (err) => {
        if (err) {
          client.destroy();
          reject(`❌ Failed to send request: ${err.message}`);
        }
      });
    });

    client.on("data", (chunk) => {
      buffer += chunk.toString();
      
      // Check if we have a complete JSON response (ends with newline)
      if (buffer.includes("\n") && !resolved) {
        resolved = true;
        
        try {
          const trimmed = buffer.trim();
          const firstLine = trimmed.split("\n")[0];
          const response = JSON.parse(firstLine);
          
          // Give a tiny delay before closing to ensure write completes
          setImmediate(() => {
            client.end();
          });
          
          resolve(response);
        } catch (err) {
          client.destroy();
          reject(`❌ Failed to parse JSON response: ${err.message}`);
        }
      }
    });

    client.on("end", () => {
      if (!resolved) {
        reject("❌ Connection closed before receiving response");
      }
    });

    client.on("error", (err) => {
      if (!resolved) {
        if (err.code === "ENOENT") {
          reject("❌ Pipe server unavailable");
        } else {
          reject(`❌ Pipe error: ${err.message}`);
        }
      }
    });

    // Timeout after 5 seconds
    client.setTimeout(5000);
    client.on("timeout", () => {
      if (!resolved) {
        client.destroy();
        reject("❌ Request timeout - no response from server");
      }
    });
  });
}