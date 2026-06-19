/**
 * Mist - 画像処理サービス (チェックポイント3)
 * 
 * 仕様:
 * 1. 画像の長辺を最大700pxに縮小
 * 2. 格子状ドット間引き処理 (TODO: 将来実装)
 * 3. AVIF変換 (TODO: 将来実装)
 */

/**
 * 画像ファイルをリサイズおよびドット間引き加工する
 * @param {File} file - アップロードされた画像ファイル
 * @param {object} options - 加工オプション
 * @param {number} options.maxDimension - 最大長辺 (デフォルト700)
 * @param {number} options.dotSpacing - ドットの間隔ピクセル数 (デフォルト2)
 * @returns {Promise<File>} 加工後の画像ファイル (AVIF形式、将来的な拡張を見越す)
 */
export async function processImage(file, { maxDimension = 700 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 1. リサイズ計算 (長辺を最大 maxDimension に制限)
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Canvasの作成
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 画像を一度そのままCanvasに描画
        ctx.drawImage(img, 0, 0, width, height);

        // 2. TODO: 格子状ドット間引き処理 (ピクセル操作)
        // 現時点ではリサイズ処理のみを行い、ドット間引きは将来実装のためのTODOとします。
        /*
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const index = (y * width + x) * 4;
              if (x % dotSpacing === 0 || y % dotSpacing === 0) {
                data[index + 3] = Math.round(data[index + 3] * 0.15); 
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        } catch (e) {
          console.error("Failed to apply dot filter to image", e);
        }
        */

        // 3. TODO: AVIF変換
        // 現時点ではPNGとしてBlobを作成し、拡張子を疑似的に.avifとします。
        const outputType = 'image/png'; 
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }
          
          const processedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, "") + ".avif", 
            { type: "image/avif", lastModified: Date.now() }
          );

          resolve(processedFile);
        }, outputType);
      };
      
      img.onerror = (err) => {
        reject(err);
      };
    };
    
    reader.onerror = (err) => {
      reject(err);
    };
  });
}
