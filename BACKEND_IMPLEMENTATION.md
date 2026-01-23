# 🔗 Instrucciones para Backend - EinsmartBcknd

Este documento contiene las instrucciones específicas para implementar los cambios necesarios en el backend para soportar las nuevas funcionalidades del frontend.

**Repositorio:** https://github.com/yuriEGV/EinsmartBcknd.git

---

## 1. Logo para Tenants

### Modelo (si necesita actualización)

En `src/models/Tenant.js` o similar, agregar:

```javascript
logo: {
    type: String,
    default: null,
    // Almacena Base64 string de la imagen
}
```

### Controlador

El endpoint de actualización de tenant debe aceptar el logo en el body:

```javascript
router.put('/tenants/:id', async (req, res) => {
    const { name, domain, logo, paymentType, address, phone, contactEmail } = req.body;
    
    const tenant = await Tenant.findByIdAndUpdate(
        req.params.id,
        { name, domain, logo, paymentType, address, phone, contactEmail },
        { new: true }
    );
    
    res.json(tenant);
});
```

**NOTA:** El logo viene como string Base64 desde el frontend.

---

## 2. Material Complementario Curricular (NUEVO)

### Paso 1: Crear Modelo

Crear archivo `src/models/CurriculumMaterial.js`:

```javascript
const mongoose = require('mongoose');

const curriculumMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null
    },
    objectives: [{
        type: String,
        required: true
    }],
    content: {
        type: String,
        default: ''
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CurriculumMaterial', curriculumMaterialSchema);
```

### Paso 2: Crear Controlador

Crear archivo `src/controllers/curriculumMaterialController.js`:

```javascript
const CurriculumMaterial = require('../models/CurriculumMaterial');
const fs = require('fs');
const path = require('path');

// GET all materials
exports.getAll = async (req, res) => {
    try {
        const materials = await CurriculumMaterial.find({ tenantId: req.headers['x-tenant-id'] })
            .populate('courseId', 'name')
            .populate('subjectId', 'name')
            .populate('uploadedBy', 'name email');
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET by ID
exports.getById = async (req, res) => {
    try {
        const material = await CurriculumMaterial.findById(req.params.id)
            .populate('courseId')
            .populate('subjectId')
            .populate('uploadedBy');
        if (!material) return res.status(404).json({ message: 'Not found' });
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET by Course
exports.getByCourse = async (req, res) => {
    try {
        const materials = await CurriculumMaterial.find({
            courseId: req.params.courseId,
            tenantId: req.headers['x-tenant-id']
        }).populate('subjectId', 'name');
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET by Subject
exports.getBySubject = async (req, res) => {
    try {
        const materials = await CurriculumMaterial.find({
            subjectId: req.params.subjectId,
            tenantId: req.headers['x-tenant-id']
        });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE
exports.create = async (req, res) => {
    try {
        const { title, description, courseId, subjectId, objectives, content } = req.body;
        const tenantId = req.headers['x-tenant-id'];
        const uploadedBy = req.user._id; // Asume autenticación

        let fileUrl = null;
        let fileName = null;
        let fileType = null;

        // Handle file upload si existe
        if (req.file) {
            fileName = req.file.originalname;
            fileType = req.file.mimetype;
            
            // Guardar archivo usando storageService (similar a matriculas)
            // O guardar en el sistema de archivos
            fileUrl = `/files/curriculum/${req.file.filename}`;
        }

        const material = new CurriculumMaterial({
            title,
            description,
            courseId,
            subjectId: subjectId || null,
            objectives: Array.isArray(objectives) 
                ? objectives 
                : JSON.parse(objectives),
            content,
            fileUrl,
            fileName,
            fileType,
            uploadedBy,
            tenantId
        });

        await material.save();
        const populated = await material.populate('courseId uploadedBy');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        const { title, description, courseId, subjectId, objectives, content } = req.body;
        const material = await CurriculumMaterial.findById(req.params.id);

        if (!material) return res.status(404).json({ message: 'Not found' });

        material.title = title || material.title;
        material.description = description || material.description;
        material.courseId = courseId || material.courseId;
        material.subjectId = subjectId || material.subjectId;
        material.objectives = Array.isArray(objectives) 
            ? objectives 
            : JSON.parse(objectives || '[]');
        material.content = content || material.content;
        material.updatedAt = Date.now();

        // Handle file replacement si existe
        if (req.file) {
            material.fileName = req.file.originalname;
            material.fileType = req.file.mimetype;
            material.fileUrl = `/files/curriculum/${req.file.filename}`;
        }

        await material.save();
        const populated = await material.populate('courseId uploadedBy');
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE
exports.delete = async (req, res) => {
    try {
        const material = await CurriculumMaterial.findByIdAndDelete(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found' });
        
        // Eliminar archivo si existe
        if (material.fileUrl) {
            const filePath = path.join(__dirname, '..', material.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DOWNLOAD file
exports.downloadFile = async (req, res) => {
    try {
        const material = await CurriculumMaterial.findById(req.params.id);
        if (!material || !material.fileUrl) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        const filePath = path.join(__dirname, '..', material.fileUrl);
        res.download(filePath, material.fileName);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

### Paso 3: Crear Routes

Crear archivo `src/routes/curriculumMaterials.js`:

```javascript
const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumMaterialController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// GET all
router.get('/', auth, curriculumController.getAll);

// GET by ID
router.get('/:id', auth, curriculumController.getById);

// GET by Course
router.get('/course/:courseId', auth, curriculumController.getByCourse);

// GET by Subject
router.get('/subject/:subjectId', auth, curriculumController.getBySubject);

// CREATE
router.post('/', auth, upload.single('file'), curriculumController.create);

// UPDATE
router.put('/:id', auth, upload.single('file'), curriculumController.update);

// DELETE
router.delete('/:id', auth, curriculumController.delete);

// DOWNLOAD file
router.get('/:id/download', auth, curriculumController.downloadFile);

module.exports = router;
```

### Paso 4: Registrar Routes en app.js

En tu archivo principal (app.js o index.js):

```javascript
const curriculumMaterials = require('./routes/curriculumMaterials');

app.use('/api/curriculum-materials', curriculumMaterials);
```

---

## 3. Endpoint de Apoderados (Verificar/Actualizar)

### Asegurar que exista GET /api/apoderados

```javascript
// En tu archivo de rutas de apoderados
router.get('/', auth, async (req, res) => {
    try {
        const apoderados = await Apoderado.find({ 
            tenantId: req.headers['x-tenant-id'] 
        }).select('nombre apellidos correo telefono direccion parentesco');
        res.json(apoderados);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
```

---

## 4. Validaciones Importantes

### En los Controladores:

```javascript
// Validar que el usuario tenga permisos
if (!['admin', 'sostenedor', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
}

// Validar que el tenantId coincida
if (material.tenantId.toString() !== req.headers['x-tenant-id']) {
    return res.status(403).json({ message: 'Forbidden' });
}
```

---

## 5. Middleware de Upload

Asegurar que el middleware de upload soporte archivos de documento:

```javascript
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

module.exports = upload;
```

---

## 6. Matrículas - Verificación

El sistema de matrículas ya está funcionando en el backend. Solo verificar que:

✅ Endpoint `GET /api/apoderados` retorna lista de apoderados
✅ Endpoint `POST /api/enrollments` acepta `apoderadoId` u `apoderado` completo
✅ Permite crear múltiples matrículas con el mismo `apoderadoId`

---

## 7. Testing en Postman

### Crear Material Curricular

```bash
POST /api/curriculum-materials
Headers:
  - Authorization: Bearer {token}
  - x-tenant-id: {tenantId}
  - Content-Type: multipart/form-data

Body:
{
    "title": "Objetivos Matemáticas Unidad 1",
    "description": "Objetivos de aprendizaje para la unidad 1",
    "courseId": "63f7b1234567890123456789",
    "subjectId": "63f7b1234567890123456790",
    "objectives": "[\"Reconocer números hasta 100\", \"Realizar operaciones básicas\"]",
    "content": "Contenido detallado...",
    "file": @archivo.pdf
}
```

### Obtener Materiales por Curso

```bash
GET /api/curriculum-materials/course/{courseId}
Headers:
  - Authorization: Bearer {token}
  - x-tenant-id: {tenantId}
```

### Actualizar Material

```bash
PUT /api/curriculum-materials/{id}
Headers:
  - Authorization: Bearer {token}
  - x-tenant-id: {tenantId}
  - Content-Type: application/json

Body:
{
    "title": "Nuevo título",
    "objectives": "[\"Nuevo objetivo\"]"
}
```

---

## ⚠️ Checklist de Implementación

- [ ] Crear modelo CurriculumMaterial
- [ ] Crear controlador de CurriculumMaterial
- [ ] Crear rutas de CurriculumMaterial
- [ ] Registrar rutas en app.js
- [ ] Verificar endpoint GET /api/apoderados
- [ ] Configurar middleware de upload para documentos
- [ ] Implementar validaciones de permisos
- [ ] Implementar validaciones de tenantId
- [ ] Probar con Postman
- [ ] Agregar índices en MongoDB (opcional pero recomendado)

```javascript
// Índices recomendados
db.curriculummaterials.createIndex({ courseId: 1, tenantId: 1 });
db.curriculummaterials.createIndex({ subjectId: 1, tenantId: 1 });
db.curriculummaterials.createIndex({ title: "text", description: "text" });
```

---

## 📞 Referencia

Para ver el patrón de implementación similar, revisar:
- Controlador de Matrículas
- Rutas de Evaluaciones
- Middleware de Autenticación

---

**Actualizado:** 23 de Enero, 2026
