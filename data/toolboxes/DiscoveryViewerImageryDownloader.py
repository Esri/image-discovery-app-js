__author__ = 'rich5127'

import arcpy, json, urllib2, shutil, os, datetime
from zipfile import ZipFile


def getDirectoryList(folder):
    directoryList = []
    for root, subFolders, files in os.walk(folder):
        for subFolder in subFolders:
            directoryList.append(subFolder)
    return directoryList


def zipDirectoryToScratch(folder):
    rootChildDirectories = getDirectoryList(folder)
    zipName = "ImageryExport" + datetime.date.today().strftime('%m_%d_%Y') + ".zip"
    zipPath = os.path.join(arcpy.env.scratchFolder, zipName)
    with ZipFile(zipPath, "w") as zipFile:
        for rootChildDirectory in rootChildDirectories:
            childDirectoryFullPath = os.path.join(folder, rootChildDirectory)
            addDirectoryToZip(childDirectoryFullPath, rootChildDirectory, zipFile)
        zipFile.close()
    return zipPath


def addDirectoryToZip(fullPath, relativePath, zipFile):
    for root, dirs, files in os.walk(fullPath):
        for currentFile in files:
            writePath = os.path.join(relativePath, currentFile)
            zipFile.write(os.path.join(root, currentFile), writePath)


def download(url, outFile):
    r = urllib2.urlopen(urllib2.Request(url))
    try:
        with open(outFile, 'wb') as f:
            shutil.copyfileobj(r, f)
    finally:
        r.close()


def downloadItemsFromJson(urlJson, rootOutFolder):
    downloadArray = json.loads(urlJson)
    for downloadItem in downloadArray:
        try:
            url = downloadItem["url"]
            label = downloadItem["label"]
            serviceName = downloadItem["serviceName"]
            outFolder = os.path.join(rootOutFolder, serviceName)
            if not os.path.exists(outFolder):
                os.makedirs(outFolder)
            outFile = os.path.join(outFolder, label)
            arcpy.AddMessage("Downloading %s" % url)
            download(url, outFile)
        except:
            arcpy.AddMessage("Invalid download item passed. continuing")


def cleanup(folder):
    #removes all directories in the scratch folder
    childDirectories = getDirectoryList(folder)
    for childDirectory in childDirectories:
        childDirectoryFullPath = os.path.join(folder, childDirectory)
        shutil.rmtree(childDirectoryFullPath)


inputJson = arcpy.GetParameterAsText(0)
outFolder = os.path.join(arcpy.env.scratchFolder, "downloadItems")
if not os.path.exists(outFolder):
    os.makedirs(outFolder)
# outFolder = "C:\\temp"
downloadItemsFromJson(inputJson, outFolder)
zipPath = zipDirectoryToScratch(outFolder)
cleanup(outFolder)
arcpy.AddMessage("zip generated")
arcpy.SetParameterAsText(1, zipPath)
