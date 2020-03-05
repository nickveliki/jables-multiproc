# Jables Multiproc Documentation

Jables Multiproc runs one or more Jables instances in different threads. These are defined by their locations (in the file system). Every database query must contain a location key in the query object, and for the query to be successful, this location must have been instantiated with jables.setup()

### async function: setup

args: object with keys: location, secDatFileLoc

instantiates a new instance of a Jables Database at location encrypted with data from secDatFileLoc. If no file exists at SecDatFileLoc, Jables will automatically generate a key an iv for encryption, save them at the secDatFileLoc, and use them in subsequent operations


### async function: writeDefinition

args: object with keys: location, definition

writes a definition. Definition must have keys: path, indexKey, and a key named by the value defined by indexKey (eg {path:'somewhere', indexKey:'testKey', testKey:'test'}). If no definition exists at path, a new one will be created, and a Dataset will be stored in this definition containing all keys that are not path or indexKey

//({path: 'somewhere', indexKey:'testKey', testKey: 'test'} will be stored in the definition named 'somewhere' which knows the indexKey 'testKey' as {testKey:'test'})

writeDefintion automatically updates datasets with matching indexKeys

// if {testkey: 'test'} already exists in definition 'somewhere' with indexKey 'testKey', then writeDefinition({path: 'somewhere', indexKey:'testKey', testKey:'test', testColumn:'success'}) will expand {testKey:'test'} to {testKey:'test', testColumn: 'success'})


### async function: getDefinitions

args: object with keys: location, definition, strict

yields the paths of all definitions which match definition. If strict is set, and set to true, then only an exact match will be yielded (cannot be used with an empty string for definition in strict mode). providing an empty string in non-strict mode will yield all definition paths


### async function: getDefinition

args: object with keys: location, definition

yields the definition data {indexKey, Versions} at the path of definition (definition can itself be the path, or contain a key named path with the information)

if no such definition at path exists, yields an error 404


### async function: getDefinitionProperties

args: object with keys: location, definition

yields the dataset which matches the definitions indexed key value

//(getDefinitionProperties({path: 'somewhere', testKey: 'test'}) will yield {testKey: 'test', testColumn:'success'} from the definition at path: 'somewhere' if this definition has the indexKey: 'testKey', which, according to our example, is true) 

if definition doesn't contain a key which matches the definitions indexKey value, it will reject with a 409 error. If no Dataset can be found that is specified by the indexed key, it will reject with 404


### async function: getDefinitionProperty

args: object with keys: location, definition

yields a data field from getDefinitionProperties with the key name defined in definition.property

rejects with 404 if the dataset can't be found, or if it doesn't have the property defined in the search definition

### async function: getTwig

args: object with keys: location, definition

since arbitrarily complex data can be stored in these definitions, and you might not always need the entire dataset or even a large portion of it, getTwig provides a function to get an arbitrarily deep dataset field. follows the Twig property of the search definition.

Twig is like property in getProperty, but supports '.' to navigate to deeper levels of the object's structure

rejects with 404 if the chain of properties is interrupted

### async function: getTwigBFD

like getTwig, but falls back to a dataset that has the indexed value 'default' or 0 if the properties can't be found on the object searched for. This obviously only makes sense if you have defined such a dataset. Rejects with 404 if the chain of properties on the sought item and the default item are interrupted, or if there is no default to fall back to
