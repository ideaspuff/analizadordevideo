import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const downloadImage = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAllAsZip = async (screenshots, zipFileName = 'screenshots.zip') => {
  const zip = new JSZip();

  for (const screenshot of screenshots) {
    const response = await fetch(screenshot.url);
    const blob = await response.blob();
    zip.file(screenshot.fileName, blob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipFileName);
};

export const cleanupUrls = (urls) => {
  urls.forEach(url => {
    if (url && typeof url === 'string') {
      URL.revokeObjectURL(url);
    }
  });
};
