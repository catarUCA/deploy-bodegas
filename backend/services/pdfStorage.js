const fs = require('fs');
const crypto = require('crypto');

const calculateFileHash = async (absPath) => {
  try {
    if (!absPath || !fs.existsSync(absPath)) return null;
    const buffer = await fs.promises.readFile(absPath);
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  } catch (err) {
    console.error('PdfStorage: hash error', err.message);
    return null;
  }
};

const pdfStorage = {
  rename: async (currentAbsPath, newAbsPath) => {
    if (currentAbsPath === newAbsPath) return { renamed: false };

    if (!fs.existsSync(currentAbsPath)) {
      console.log('PdfStorage: rename skipped, source not found:', currentAbsPath);
      return { renamed: false };
    }

    try {
      await fs.promises.rename(currentAbsPath, newAbsPath);
      console.log('PdfStorage: renamed', currentAbsPath, '→', newAbsPath);
      return { renamed: true };
    } catch (err) {
      console.error('PdfStorage: rename error', err.message);
      return { renamed: false };
    }
  },

  store: async (tempAbsPath, oldAbsPath, finalAbsPath) => {
    if (!tempAbsPath || !fs.existsSync(tempAbsPath)) {
      return { pdfPath: null, contentChanged: false, oldFileStillExists: false };
    }

    if (oldAbsPath && fs.existsSync(oldAbsPath)) {
      const oldHash = await calculateFileHash(oldAbsPath);
      const newHash = await calculateFileHash(tempAbsPath);

      if (oldHash && newHash && oldHash === newHash) {
        try {
          await fs.promises.unlink(tempAbsPath);
        } catch (e) {
          console.error('PdfStorage: temp cleanup error', e.message);
        }

        if (oldAbsPath === finalAbsPath) {
          return { pdfPath: null, contentChanged: false, oldFileStillExists: true };
        }

        try {
          await fs.promises.rename(oldAbsPath, finalAbsPath);
          return { pdfPath: finalAbsPath, contentChanged: false, oldFileStillExists: false };
        } catch (e) {
          console.error('PdfStorage: rename after hash match error', e.message);
          return { pdfPath: null, contentChanged: false, oldFileStillExists: true };
        }
      }
    }

    try {
      if (fs.existsSync(finalAbsPath)) await fs.promises.unlink(finalAbsPath);
      await fs.promises.rename(tempAbsPath, finalAbsPath);
      return { pdfPath: finalAbsPath, contentChanged: true, oldFileStillExists: !!oldAbsPath && fs.existsSync(oldAbsPath) };
    } catch (e) {
      console.error('PdfStorage: move error', e.message);
      return { pdfPath: null, contentChanged: false, oldFileStillExists: false };
    }
  }
};

module.exports = pdfStorage;
