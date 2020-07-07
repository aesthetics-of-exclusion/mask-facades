#!/usr/bin/env node

const { db, getAnnotations, addAnnotation, uploadFile } = require('../database/google-cloud')
const axios = require('axios')

const image = require('./image')

const annotationType = 'mask'

const annotationOfType = (annotations, type) => annotations
  .filter((annotation) => annotation.type === type)[0]

const downloadImage = (url) => axios.get(url, {
  responseType: 'arraybuffer'
}).then((response) => response.data)

async function maskFacade () {
  const query = db.collection('pois')
    .where('annotations.mask', '==', 0)
    .limit(1)

  const poiRefs = await query.get()

  if (poiRefs.empty) {
    console.error('No POIs found')
    // process.exit(1)
  } else {
    const poiRef = poiRefs.docs[0]
    const poiId = poiRef.id

    console.log('Masking POI:', poiId)

    const annotationRefs = await getAnnotations(poiId, ['facade', 'screenshot'])
    const annotations = annotationRefs.docs.map((doc) => doc.data())

    const screenshotUrl = annotationOfType(annotations, 'screenshot').data.screenshotUrl
    const mask = annotationOfType(annotations, 'facade').data.mask

    const imageBuffer = await downloadImage(screenshotUrl)

    const buffers = await image.save(imageBuffer, mask)

    const urls = {}

    for (let [filename, buffer] of Object.entries(buffers)) {
      const contentType = filename.endsWith('jpg') ? 'image/jpeg' : 'image/png'
      const { url } = await uploadFile('amsterdam', poiId, annotationType, buffer, filename, contentType)

      urls[filename] = url
    }

    await addAnnotation(poiId, annotationType, {
      urls
    })
  }
}

maskFacade()
