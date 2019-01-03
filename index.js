const fs = require('fs')
const path = require('path')
const axios = require('axios')
const StoryblokClient = require('storyblok-js-client')

const config = {
  // on your space dashboard
  space: 'YOUR_SPACE_ID',
  // https://www.storyblok.com/docs/management-api/authentication#authentication
  oauthToken: 'YOUR_OAUTH_TOKEN'
}

const storyblok = new StoryblokClient({
  oauthToken: config.oauthToken
})

let assetFolders = {}
let assets = []

const generateFolders = async () => {
  let folderResponse = await storyblok.get(`spaces/${config.space}/asset_folders`)

  folderResponse.data.asset_folders.forEach(folder => {
    assetFolders[folder.id] = path.join(__dirname, 'download' , folder.name)
    fs.mkdirSync(assetFolders[folder.id], { recursive: true })
  })

  getAssets()
}

const getAssets = async () => {
  const per_page = 10 // do not exceed 10 
  let response = await storyblok.get(`spaces/${config.space}/assets`, { per_page: per_page, page: 1 })
  const total = response.headers.total
  const maxPage = Math.ceil(total / per_page)

  assets = assets.concat(response.data.assets)

  for (let index = 2; index <= maxPage; index++) {
    let res = await storyblok.get(`spaces/${config.space}/assets`, { per_page: per_page, page: index })
    assets = assets.concat(res.data.assets)
  }  

  downloadAssets()
}

const downloadAssets = async () => {
  for (let index = 0; index < assets.length; index++) {
    const file = assets[index];
    let response = await axios.request({
      responseType: 'arraybuffer',
      url: file.filename,
      method: 'get'
    })
  
    let filename = path.basename(file.filename)
    let outputPath = path.join(__dirname, 'download', filename)
    
    if (file.asset_folder_id != null) {
      outputPath = path.join(assetFolders[file.asset_folder_id], filename)
    }
    
    fs.writeFileSync(outputPath, response.data);
    console.log('Downloaded: ', outputPath)
  }
}

generateFolders()