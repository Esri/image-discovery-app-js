__author__ = 'rich5127'

# Esri start of added imports
import glob, zipfile, arcpy


def kmlToFeatures(kmlFile):
    arcpy.AddMessage("kmlToFeatures")
    arcpy.KMLToLayer_conversion(kmlFile, arcpy.env.scratchFolder, "outKML")
    return arcpy.env.scratchFolder + "/outKML.gdb/Placemarks/Polygons"

def kmzToFeatures(inKMZ):
    arcpy.AddMessage("kmzToFeatures")
    arcpy.AddMessage("parsed Zip")
    zf = zipfile.ZipFile(inKMZ)
    zf.namelist()
    for name in zf.namelist():
        if name.endswith(".kml"):
            kmlExtract = zf.extract(name)
            arcpy.AddMessage(kmlExtract)
            arcpy.KMLToLayer_conversion(kmlExtract, arcpy.env.scratchFolder, "outKML")
            return arcpy.env.scratchFolder + "/outKML.gdb/Placemarks/Polygons"
    arcpy.AddError("No KML was found in KMZ file")

def polygonsToMultiPolygon(inPolygons):
    arcpy.AddMessage("polygonsToMultiPolygon")
    desc = arcpy.Describe(inPolygons)
    shapeFieldName = desc.ShapeFieldName
    polygonRows = arcpy.SearchCursor(inPolygons)
    multiPoly = (arcpy.CreateFeatureclass_management(arcpy.env.scratchGDB, "multiPolygon", "POLYGON",inPolygons,"SAME_AS_TEMPLATE","SAME_AS_TEMPLATE",desc.spatialReference))
    polyArray = arcpy.Array()
    for polygonRow in polygonRows:
        feat = polygonRow.getValue(shapeFieldName)
        i = 0
        while i < feat.partCount:
            polyArray.append(feat.getPart(i))
            i += 1
    del polygonRows
    insertCursor = arcpy.InsertCursor(multiPoly)
    newRow = insertCursor.newRow()
    polygon = arcpy.Polygon(polyArray)
    newRow.shape = polygon
    insertCursor.insertRow(newRow)
    del newRow
    del insertCursor
    return arcpy.env.scratchGDB  + "/multiPolygon"

def shpToFeatures(inShpZip):
    arcpy.AddMessage("shpToFeatures")
    #extract the zip
    zf = zipfile.ZipFile(inShpZip)
    polygonFeaturesPath = arcpy.env.scratchFolder + "/zipSHPExtract"
    zf.extractall(polygonFeaturesPath)
    #find the shp
    shpFilesFromZip = glob.glob(polygonFeaturesPath + "/*.shp")
    arcpy.AddMessage("Shapefile count in zip: " + str(len(shpFilesFromZip)))
    if len(shpFilesFromZip) > 0:
        outFeatures = arcpy.env.scratchGDB + "/outFeatures"
        arcpy.CopyFeatures_management(shpFilesFromZip[0], outFeatures)
        return outFeatures
    else:
        arcpy.AddError("No shapes were found")
def ProcessInput():
    sourceKMLFile = arcpy.GetParameterAsText(0)
    sourceSHPFile = arcpy.GetParameterAsText(1)
    sourceKMZFile = arcpy.GetParameterAsText(2)
    if sourceKMLFile:
        outputFeatureClass = kmlToFeatures(sourceKMLFile)
    elif sourceSHPFile:
        outputFeatureClass = shpToFeatures(sourceSHPFile)
    elif sourceKMZFile:
        outputFeatureClass = kmzToFeatures(sourceKMZFile)

    outputFeatureClass = polygonsToMultiPolygon(outputFeatureClass)
    arcpy.SetParameterAsText(3, outputFeatureClass)

ProcessInput()



