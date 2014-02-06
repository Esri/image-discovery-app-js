__author__ = 'rich5127'

import arcpy, json, urllib2, shutil, os, datetime
from zipfile import ZipFile


def zipDirectoryToScratch(folder):
    zipName = "ImageryExport" + datetime.date.today().strftime('%m_%d_%Y') + ".zip"
    zipPath = os.path.join(arcpy.env.scratchFolder, zipName)
    root_len = len(os.path.abspath(folder))
    with ZipFile(zipPath, "w") as zip:
        for root, dir, files in os.walk(folder):
            archive_root = os.path.abspath(root)[root_len:]
            arcpy.AddMessage("archive_root: {0}".format(archive_root))
            for f in files:
                fullpath = os.path.join(root, f)
                archive_name = os.path.join(archive_root, f)
                arcpy.AddMessage("archive_name: {0}".format(archive_name))
                zip.write(fullpath, archive_name)
    return zipPath

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
            id = downloadItem["id"]
            url = downloadItem["url"]
            label = downloadItem["label"]
            serviceName = downloadItem["serviceName"]
            outFolder = os.path.join(rootOutFolder, serviceName)
            folderParts = id.split("\\")
            for part in folderParts:
                if part != "." and part != label:
                    arcpy.AddMessage("adding url part: " + part)
                    outFolder = os.path.join(outFolder, part)
                    arcpy.AddMessage("folder: " + outFolder)
            if not os.path.exists(outFolder):
                os.makedirs(outFolder)
            outFile = os.path.join(outFolder, label)
            arcpy.AddMessage("Downloading %s" % url)
            arcpy.AddMessage("Writing File: " + outFile)
            download(url, outFile)
        except:
            arcpy.AddMessage("Invalid download item passed. continuing")


def cleanup(folder):
    arcpy.AddMessage("Cleanup:" + folder)
    shutil.rmtree(folder)


inputJson = arcpy.GetParameterAsText(0)
outFolder = os.path.join(arcpy.env.scratchFolder, "downloadItems")
if not os.path.exists(outFolder):
    os.makedirs(outFolder)
downloadItemsFromJson(inputJson, outFolder)
zipPath = zipDirectoryToScratch(outFolder)
cleanup(outFolder)
arcpy.AddMessage("zip generated")
arcpy.SetParameterAsText(1, zipPath)
