'''
Created on Dec 17, 2012

@author: jenn6701
'''
import json, csv, arcpy
import reportGenerator as testGP

arcpy.overwriteOutput = True

class Generator():
    
    def __init__(self):
        pass

    @staticmethod
    def _getExampleJSON():
        return(
{
    "format": "CSV",
    "featureSet": {
        "fields": [
            {
                "name": "id",
                "type": "esriFieldTypeOID",
                "alias": "id",
                "domain": null
            },
            {
                "name": "Category",
                "type": "esriFieldTypeString",
                "alias": "Category",
                "domain": null
            },
            {
                "name": "Sensor",
                "type": "esriFieldTypeString",
                "alias": "Sensor",
                "domain": null,
                "length": 20
            },
            {
                "name": "Name",
                "type": "esriFieldTypeString",
                "alias": "Name",
                "domain": null,
                "length": 50
            },
            {
                "name": "GSD",
                "type": "esriFieldTypeDouble",
                "alias": "GSD",
                "domain": null
            },
            {
                "name": "Product",
                "type": "esriFieldTypeString",
                "alias": "Product",
                "domain": null,
                "length": 50
            },
            {
                "name": "Tag",
                "type": "esriFieldTypeString",
                "alias": "Tag",
                "domain": null,
                "length": 20
            },
            {
                "name": "Acquisition",
                "type": "esriFieldTypeDate",
                "alias": "Acquisition",
                "domain": null,
                "length": 8
            },
            {
                "name": "Shape",
                "type": "esriFieldTypeGeometry",
                "alias": "Shape",
                "domain": null
            },
            {
                "name": "Shape_Length",
                "type": "esriFieldTypeDouble",
                "alias": "Shape_Length",
                "domain": null
            },
            {
                "name": "Shape_Area",
                "type": "esriFieldTypeDouble",
                "alias": "Shape_Area",
                "domain": null
            }
        ],
        "spatialReference": {
            "wkid": 4326,
            "latestWkid": 4326
        },
        "geometryType": "esriGeometryPolygon",
        "features": [
            {
                "geometry": {
                    "rings": [
                        [
                            [
                                -73.164573769,
                                6.45241287600004
                            ],
                            [
                                -73.5036030649999,
                                4.88333157900007
                            ],
                            [
                                -75.1648317469999,
                                5.13147431500005
                            ],
                            [
                                -74.824423526,
                                6.69703536600002
                            ],
                            [
                                -73.164573769,
                                6.45241287600004
                            ]
                        ]
                    ],
                    "spatialReference": {
                        "wkid": 4326,
                        "latestWkid": 4326
                    }
                },
                "attributes": {
                    "Shape_Length": 6.56487042367279,
                    "Shape_Area": 2.68629907438408,
                    "id": 66,
                    "Category": "Primary",
                    "Sensor": "Landsat-7-ETM+",
                    "Name": "L71008056_05620091213",
                    "GSD": 0.000269494585235856,
                    "Product": "L1T",
                    "Tag": "MS",
                    "Acquisition": 1260716598501
                }
            }
        ]
    },
    "displayFormats": {
		"floatPrecision": 1,
        "date": "dd-MM-yyyy"
    }
}
                    )

    @staticmethod
    def generateInputString_SHP():
        jsonDict = Generator._getExampleJSON()
        jsonDict['format'] = "SHP"
        return json.dumps(jsonDict)
      
    @staticmethod
    def generateInputString_CSV():
        #jsonDict = Generator._getExampleJSON()
        #jsonDict['format'] = "CSV"
        #return json.dumps(jsonDict)
        
        return json.dumps(
{"format":"CSV",
 "featureSet":{
               "fields":[
                         {"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","domain":None},
                         {"name":"Product","type":"esriFieldTypeString","alias":"ProductName","domain":None,"length":50},
                         {"name":"Sensor","type":"esriFieldTypeString","alias":"Sensor Name","domain":None,"length":20},
                         {"name":"Tag","type":"esriFieldTypeString","alias":"Tag","domain":None,"length":20},
                         {"name":"CloudCover","type":"esriFieldTypeDouble","alias":"Cloud Cover","domain":None},
                         {"name":"GSD","type":"esriFieldTypeDouble","alias":"LowPS","domain":None},
                         {"name":"Azimuth","type":"esriFieldTypeDouble","alias":"Sun Azimuth","domain":None},
                         {"name":"SunElevation","type":"esriFieldTypeDouble","alias":"Sun Elevation","domain":None},
                         {"name":"Acquisition","type":"esriFieldTypeDate","alias":"Acquisition Date","domain":None,"length":8},
                         {"name":"Shape","type":"esriFieldTypeGeometry","alias":"Shape","domain":None},
                         {"name":"Shape_Length","type":"esriFieldTypeDouble","alias":"Shape_Length","domain":None},
                         {"name":"Shape_Area","type":"esriFieldTypeDouble","alias":"Shape_Area","domain":None}],
               "spatialReference":{"wkid":102100},
               "geometryType":"esriGeometryPolygon",
               "features":[{"geometry":{"rings":[[[5202235.340599999,2822577.2939999998],[5202205.059,2820154.6876999997],[5198782.715,2820197.540600002],[5195360.3068,2820239.6268999986],[5195389.514699999,2822662.3238999993],[5195418.753800001,2825085.396899998],[5195448.0242,2827508.8462999985],[5198872.0447,2827466.6248999983],[5202296.0009,2827423.6345999986],[5202265.6545,2825000.2760999985],[5202235.340599999,2822577.2939999998]]],"spatialReference":{"wkid":102100}},"attributes":{"OBJECTID":1,"Shape_Length":28233.050514442795,"Shape_Area":49774392.019929975,"Product":"Geo","Sensor":"GeoEye-1","Tag":"MS","CloudCover":0,"GSD":2,"Azimuth":95.1,"SunElevation":74.24246,"Acquisition":1338622980000}},{"geometry":{"rings":[[[5202234.793499999,2822577.485100001],[5202204.516600002,2820155.2470999993],[5198782.7217999995,2820198.0929999985],[5195360.862799998,2820240.172600001],[5195390.066300001,2822662.5014000013],[5195419.301100001,2825085.2060000002],[5195448.567200001,2827508.286899999],[5198872.037900001,2827466.0722999983],[5202295.444400001,2827423.0889],[5202265.102699999,2825000.0989000015],[5202234.793499999,2822577.485100001]]],"spatialReference":{"wkid":102100}},"attributes":{"OBJECTID":2,"Shape_Length":28228.642077310138,"Shape_Area":49758837.16637409,"Product":"Geo","Sensor":"GeoEye-1","Tag":"MS","CloudCover":0,"GSD":0.5,"Azimuth":95.1,"SunElevation":74.24246,"Acquisition":1338622980000}},{"geometry":{"rings":[[[5202234.793499999,2822577.485100001],[5202204.516600002,2820155.2470999993],[5198782.7217999995,2820198.0929999985],[5195360.862799998,2820240.172600001],[5195390.066300001,2822662.5014000013],[5195419.301100001,2825085.2060000002],[5195448.567200001,2827508.286899999],[5198872.037900001,2827466.0722999983],[5202295.444400001,2827423.0889],[5202265.102699999,2825000.0989000015],[5202234.793499999,2822577.485100001]]],"spatialReference":{"wkid":102100}},"attributes":{"OBJECTID":3,"Shape_Length":28228.642077310138,"Shape_Area":49758837.16637409,"Product":"Geo","Sensor":"GeoEye-1","Tag":"Pan","CloudCover":0,"GSD":0.5,"Azimuth":95.1,"SunElevation":74.24246,"Acquisition":1338622980000}},{"geometry":{"rings":[[[5202231.008499999,2823834.5747000016],[5202208.567299999,2822040.0890999995],[5199846.625100002,2822069.7641000003],[5197484.6521000005,2822099.0738000013],[5197469.458000001,2823894.0637000017],[5197454.272599999,2825689.2606000006],[5197439.095899999,2827484.6646],[5199857.5363,2827454.6066000015],[5202275.944499999,2827424.164999999],[5202253.467599999,2825629.2666000016],[5202231.008499999,2823834.5747000016]]],"spatialReference":{"wkid":102100}},"attributes":{"OBJECTID":4,"Shape_Length":20331.79136253935,"Shape_Area":25742226.89794926,"Product":"Geo","Sensor":"IKONOS-2","Tag":"MS","CloudCover":0,"GSD":4,"Azimuth":131.2626,"SunElevation":60.38589,"Acquisition":1301470260000}}]},
               "displayFormats":{"floatPrecision":None,"date":"dd-MM-yyyy"}}
                          )

    @staticmethod
    def generateInputString_KMZ():
        jsonDict = Generator._getExampleJSON()
        jsonDict['format'] = "KMZ"
        return json.dumps(jsonDict)
    
class TestInputReader():

    def __init__(self):
        
        testString = Generator.generateInputString_KMZ()
        print "Test: InputReader"
        try:
            iReader = testGP.InputReader(testString)
            print "%s" % ("Passed" if "" == iReader.getObjectIds() else iReader.getObjectIds())
            print "%s" % ("Passed" if  ['ProductName', 'SensorName', 'Tag', 'CloudCover', 'LowPS', 
                                        'SunAzimuth', 'SunElevation', 'AcquisitionDate'] == iReader.getFields() else iReader.getFields())
            print "%s" % ("Passed" if "KMZ" == iReader.getReportFormat() else iReader.getReportFormat())
            print "%s" % ("Passed" if {"date": "dd-MM-yyyy", "floatPrecision" : 1} == iReader.getFormats() else iReader.getFormats())
            print "%s" % ("Passed" if {'LowPS':'GSD',
                                       'SunElevation':'Sun Elevation',
                                       'SensorName':'Sensor',
                                       'AcquisitionDate':'Acquisition',
                                       'SunAzimuth':'Azimuth',
                                       'CloudCover':'Cloud Cover',
                                       'ProductName':'Product',
                                       'Tag':'Tag'} == iReader.getLabels() else iReader.getLabels())
            print "%s" % ("Passed" if self.test_getFeatureSet() else "Failed - getFeatureSet()")
        except Exception, e:
            print "Exception:" + e.message
        
    def test_getFeatureSet(self, keep=False):
        try:
            testString = Generator.generateInputString_KMZ()
            iReader = testGP.InputReader(testString)
            fs = iReader.getFeatureSet()
            saveLoc = arcpy.CreateScratchName("test", "", "FeatureClass", arcpy.env.scratchFolder)
            fs.save(saveLoc)
            if keep: print saveLoc
            else: arcpy.Delete_management(saveLoc)
            return 1
        except Exception, e:
            print e
            return 0
        

class TestFieldObject():
    
    def __init__(self):        
        print "Test - FieldObject"
        #print "%s" % ("Passed" if self.test_Types() else "test_Types() Failed")
        #print "%s" % ("Passed" if self.test_Labels() else "test_Labels() Failed")
        #print "%s" % ("Passed" if self.test_Features() else "test_Features() Failed")
        print "%s" % ("Passed" if self.test_Format() else "test_Format() Failed")
            
    def test_Types(self):
        try:
            fo = testGP.FieldObject()
            labelsList = {"field1":"Field 1","field2":"Field 2","field3":"Field 3"}
            fo.setLabels(labelsList)
            fo.setTypes({"field1":"esriFieldTypeOID","field2":"esriFieldTypeDate", "field3":"esriFieldTypeDate"})
            assert "Field 2" == labelsList.values()[fo.getDateFields()[0]], labelsList.values()[fo.getDateFields()[0]]
            assert "Field 3" == labelsList.values()[fo.getDateFields()[1]], labelsList.values()[fo.getDateFields()[1]]
            assert "Field 1" == labelsList.values()[fo.getIDField()], labelsList.values()[fo.getIDField()] 
            return 1
        except Exception, e:
            print e
            return 0
        
    def test_Labels(self):
        try:
            fo = testGP.FieldObject()
            fo.setLabels({"field1":"Field 1","field2":"Field 2"})
            assert {'field2': 'Field 2', 'field1': 'Field 1'} == fo.getLabels(), fo.getLabels()
            assert ['Field 2', 'Field 1'] == fo.getLabelsList(), fo.getLabelsList()
            return 1
        except Exception, e:
            print e
            return 0
                 
    def test_Features(self):
        try:
            fo = testGP.FieldObject()
            
            fo.setFieldOrder(["field1", "field2"])
            fo.setLabels({"field1":"Field 1","field2":"Field 2"})
            
            try:
                fo.addFeature({"field":"1val2","field2":"2val2"})
                raise Exception("Should have thrown an exception because labels weren't defined")
            except:# Exception, e:
                pass#print "Caught labels undefined exception - "+e.message        
            
            
            fo.addFeature({"field1":"1val1","field2":"2val1"})
            fo.addFeature({"field1":"1val2","field2":"2val2"})  
            assert 2 == fo.getNumberOfFeatures(), fo.getNumberOfFeatures()
            
            assert {'field2': '2val1', 'field1': '1val1'} == fo.getFeature(0), fo.getFeature(0)
            assert {'field2': '2val2', 'field1': '1val2'} ==  fo.getFeature(1), fo.getFeature(1)
            
            assert ['1val1', '2val1'] == fo.getFeatureList(0), fo.getFeatureList(0)
            assert ['1val2', '2val2'] == fo.getFeatureList(1), fo.getFeatureList(1)
        
            try:
                fo.addFeature({"field":"1val2","field2":"2val2"})
                raise Exception("Should have thrown an exception because fields didn't match")
            except:# Exception, e:
                pass#print "Caught bad feature exception - "+e.message
            return 1
        except Exception, e:
            print e
            return 0
    
    def test_Format(self):
        try:               
            fo = testGP.FieldObject()
            fo.setFieldOrder(["AcquisitionDate", "Tag", "SensorName", "OBJECTID"])
            fo.setTypes({"AcquisitionDate":"esriFieldTypeDate", "Tag":"esriFieldTypeString", "SensorName":"esriFieldTypeString", "OBJECTID":"esriFieldTypeOID"})
            fo.addFeature({'AcquisitionDate':'1338622980000', 'Tag':'MS', 'SensorName':'GeoEye-1', 'OBJECTID':'1'})
            
            fo.setFormats({"date": "MM/dd-yyyy"})
            assert ['06/02-2012', 'MS', 'GeoEye-1', '1'] == fo.getFeatureList(0, doFormat=True), str(fo.getFeatureList(0, doFormat=True))

            fo.setFormats({"date": "yy-MM"})
            assert ['12-06', 'MS', 'GeoEye-1', '1'] == fo.getFeatureList(0, doFormat=True), fo.getFeatureList(0, doFormat=True)
            assert ['1338622980000', 'MS', 'GeoEye-1'] == fo.getFeatureList(0, doFormat=False, doIncludeID=False), fo.getFeatureList(0, doFormat=False, doIncludeID=False)
            
            fo.setFormats({})
            assert ['1338622980000', 'MS', 'GeoEye-1', '1'] == fo.getFeatureList(0, doFormat=True), fo.getFeatureList(0, doFormat=True)
            return 1
        except Exception, e:
            print e
            return 0         
    
class TestFeatureReader():
    
    def __init__(self):
        
        print "Test - FeatureReader"
        print "%s" % ("Passed" if self.test_parseJSON() else "test_parseJSON() Failed")
        print "%s" % ("Passed" if self.test_getFields() else "test_getFields() Failed")
        
    def test_parseJSON(self):
        try:               
            fr = testGP.FeatureReader()
            testString = Generator.generateFeatureString_nogometry()
            fo = fr.parseJSON(testString, [3,1], ['Tag', 'AcquisitionDate', 'SensorName', 'OBJECTID'])
            assert {'AcquisitionDate': 'Acquisition Date', 'Tag': 'Tag', 'SensorName': 'Sensor Name', 'OBJECTID': 'OBJECTID'} == fo.getLabels(), fo.getLabels()
            assert ['Pan', '1338622980000', 'GeoEye-1', '3'] == fo.getFeatureList(0), fo.getFeatureList(0)
            
            fo = fr.parseJSON(testString, [1,3], ['Tag', 'AcquisitionDate', 'SensorName', 'OBJECTID'])
            assert ['MS', '1338622980000', 'GeoEye-1', '1'] == fo.getFeatureList(0), fo.getFeatureList(0)
                        
            fo = fr.parseJSON(testString, "", ['Tag', 'SensorName', 'AcquisitionDate'])
            assert {'AcquisitionDate': 'Acquisition Date', 'Tag': 'Tag', 'SensorName': 'Sensor Name'} == fo.getLabels(), fo.getLabels()
            assert ['MS', 'GeoEye-1','1338622980000'] == fo.getFeatureList(0), fo.getFeatureList(0)
            return 1
        except Exception, e:
            print e
            return 0 
        
    def test_getFields(self):
        fr = testGP.FeatureReader()
        imageURL = Generator.generateServiceURL()#"http://kacstags1.esri.com/arcgis/rest/services/KACST/GLOBALCAT_3/ImageServer"
        objectIds = [1,4]
        
        try:
            fields = ["SensorName", "AcquisitionDate"]
            retObj = fr.getFields(imageURL, objectIds, fields)
            assert (isinstance(retObj, testGP.FieldObject)), retObj
            assert {'SensorName': 'Sensor Name','AcquisitionDate': 'Acquisition Date'} == retObj.getLabels(), retObj.getLabels()
            assert ['GeoEye-1','1338622980000'] == retObj.getFeatureList(0), retObj.getFeatureList(0)
            assert ['IKONOS-2', '1301470260000'] == retObj.getFeatureList(1), retObj.getFeatureList(1)
            
            fields = ["AcquisitionDate", "SensorName"]
            retObj = fr.getFields(imageURL, objectIds, fields)
            assert ['1338622980000', 'GeoEye-1'] == retObj.getFeatureList(0), retObj.getFeatureList(0)
            return 1
        except Exception, e:
            print e
            return 0

    def test_getFeatures(self, fr):
        raise Exception("Not Implemented")

class TestFeatureObject():
    def __init__(self):
        
        print "Test - FeatureObject"
        inputJSON_str = Generator.generateInputString_KMZ()
        fsJSON = json.loads(inputJSON_str)['featureSet']
        featureSet = arcpy.AsShape(fsJSON, True)

        try:
            testObject = testGP.FeatureObject()
            testObject.setFeatureSet(featureSet)
            newFeatureSet = testObject.getFeatureSet()
            fs = json.loads(newFeatureSet.JSON)
            print "Passed"
        except Exception, e:
            print "Failed: " + e.message    

class TestReportWriter():
    
    def __init__(self):
        
        print "Test - ReportWriter"
        print "%s" % ("Passed" if self.test_CSV() else "test_CSV() Failed")
        print "%s" % ("Passed" if self.test_SHP() else "test_SHP() Failed")
        print "%s" % ("Passed" if self.test_KMZ() else "test_KMZ() Failed")
            
    def test_CSV(self, keep=True):
        rWriter = testGP.ReportWriter("CSV")
        
        inputJSON = Generator.generateInputString_CSV()
        featureSet = arcpy.AsShape(json.loads(inputJSON)['featureSet'], True)
        testObject = testGP.FieldObject(featureSet)       
        testObject.setFormats({"date":"dd-MM-yyyy", 'floatPrecision': 1})
        
        fPath =""
        try:
            fPath = rWriter.write(testObject, doZip=False)
        except Exception, e:
            print "Failed writing CSV: "+e.message
            return 0
        
        try:            
            with open(fPath, 'rb') as csvfile:
                testreader = csv.reader(csvfile, delimiter=',')
                rows = []
                for row in testreader:
                    rows.append(row)
                assert [['ProductName', 'Sun Elevation', 'Cloud Cover', 'Tag', 'LowPS', 'Sun Azimuth', 'Sensor Name', 'Acquisition Date'],
                        ['Geo', '74.2', '0.0', 'MS', '2.0', '95.1', 'GeoEye-1', '02-06-2012'],
                        ['Geo', '74.2', '0.0', 'Pan', '0.5', '95.1', 'GeoEye-1', '02-06-2012'],
                        ['Geo', '74.2', '0.0', 'MS', '0.5', '95.1', 'GeoEye-1', '02-06-2012'],
                        ['Geo', '60.4', '0.0', 'MS', '4.0', '131.3', 'IKONOS-2', '30-03-2011']] == rows, str(rows)
        except Exception, e:
            print str("Failed reading at "+fPath+":\n"+e.message)
            return 0
        finally:
            if keep: print fPath
            else: 
                if arcpy.Exists(fPath): arcpy.Delete_management(fPath)

        try:
            fPath = rWriter.write(testObject, doZip=True)
        except Exception, e:
            print "Failed creating zipped CSV: "+e.message
            return 0
        finally:
            if keep: print fPath
            else: 
                if arcpy.Exists(fPath): arcpy.Delete_management(fPath)
        
        return 1
    
    def test_KMZ(self, keep=False):
        try:
            rWriter = testGP.ReportWriter("KMZ")
            testObject = testGP.FeatureObject()
            inputJSON = Generator.generateInputString_KMZ()
            
            featureSet = arcpy.AsShape(json.loads(inputJSON)['featureSet'], True)
            testObject.setFeatureSet(featureSet)
            rFile = rWriter.write(testObject)
            if keep: print rFile
            else: arcpy.Delete_management(rFile)
            return 1
        except Exception, e:
            print "Failure: "+e.message
            return 0        
    
    def test_SHP(self, keep=False):
        try:
            arcpy.env.workspace = "C:\Users\jenn6701\Documents\ArcGIS\Default.gdb"
            rWriter = testGP.ReportWriter("SHP")
            testObject = testGP.FeatureObject()
            inputJSON = Generator.generateInputString_KMZ()
            
            featureSet = arcpy.AsShape(json.loads(inputJSON)['featureSet'], True)        
            testObject.setFeatureSet(featureSet)
            rFile = rWriter.write(testObject)
            if keep: print rFile
            else: arcpy.Delete_management(rFile)
            return 1
        except Exception, e:
            print "Failure: "+e.message
            return 0  

class TestReportGenerator():
    
    def __init__(self):
        
        print "Test - ReportGenerator"
        print "%s" % ("Passed" if self.test_CSV() else "test_CSV() Failed")
        print "%s" % ("Passed" if self.test_SHP() else "test_SHP() Failed")
        print "%s" % ("Passed" if self.test_KMZ() else "test_KMZ() Failed")
        
    def test_CSV(self, keep=True):
        try:
            inputJSON = Generator.generateInputString_CSV()
            rg = testGP.ReportGenerator()
            print rg.run(inputJSON)
            return 1
        except Exception, e:
            print "Failed: " + str(e.message)
            return 0
        
    def test_SHP(self, keep=False):
        try:
            inputJSON = Generator.generateInputString_SHP()
            rg = testGP.ReportGenerator()
            print rg.run(inputJSON)
            return 1
        except Exception, e:
            print "Failed: " + str(e.message)
            return 0        
    
    def test_KMZ(self, keep=False):
        try:
            inputJSON = Generator.generateInputString_KMZ()
            rg = testGP.ReportGenerator()
            print rg.run(inputJSON)
            return 1
        except Exception, e:
            raise e
            print "Failed: " + str(e.message)
            return 0  
            

if __name__ == '__main__':
    #TestInputReader()
    #TestFieldObject()
    #TestFeatureObject()
    TestReportWriter()
    TestReportGenerator()
    