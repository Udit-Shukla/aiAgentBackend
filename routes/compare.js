import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import compareStocks from '../utils/compareStocks.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.fields([{ name: 'oldFile' }, { name: 'newFile' }]), async (req, res) => {
  try {
    const oldFilePath = req.files.oldFile[0].path;
    const newFilePath = req.files.newFile[0].path;

    const result = await compareStocks(oldFilePath, newFilePath);

    // Cleanup
    fs.unlinkSync(oldFilePath);
    fs.unlinkSync(newFilePath);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

export default router;
