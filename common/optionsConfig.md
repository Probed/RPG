Options Configuration Stuff
---

The [optionsConfig.js](https://github.com/Probed/RPG/blob/master/common/optionConfig.js) file
is used to recursively walk `options` and `option_constraints` objects to provide:

* [HTML Input elements](#input) arranged in tabs/tables for each `constraint`
* [Creation](#create) of `options` object from the HTML input elements.
* [Validation](#validate) of input values against a `option_constraints` object
* [Seeded random](#random) generation of an `options` objects values from an `option_constrains` object
* [Recursive merging](#merge) of `options_constraints` into a single `options_constrains` (used by Tiles so child constraints override parent constraints)

the simplest option constraint object looks like this:

    var option_constraints = {
        name : constraint
    };

more complex nested syntax:

    var option_constraints = {
        name : {
            name2 : constraint1,
            name3 : {
                name4 : constraint2
            }
        },
        name5 : constraint3
    };

* `name` : can be any name you desire and will be displayed to the user as the `input Label` (using camelCase will display for the user seperated words: ex: Camel Case
    * Special treatment is given for the following names:
        * `name` like on[A-Z]  are event properties and they are given a textarea within which to define the event stuff
        * `name` equals 'options' **ignored**

* `constraint` : takes on many forms:
    * `[num,num,num]` = Min, Max, Default Number.  Input must fall inclusive between min and max and be a numeric value
    * `[string,num,num[,string]]` = regex must be quoted to make it a string since JSON.encode/decode does not do native regex eg "/regex/". Min Length, Max Length, Default Value.
    * `[string[,string]]` = Select one from the list (first one is default)
    * `[true/false]` = Checkbox yes/no,
    * `number` = Must be numeric, but is unconstrained (number specified is default number)
    * `string` = Must be string, but is unconstrained (string specified is default string)
    * `object` = Traverse into this object for more constraints



<a name="input"></a>

## User Input Example

First we define our `options_constrains` object somewhere

    var option_constraints = {
        property : {
            size : {
                height : [0,50,10],
                width : [0,50,10]
            },
            name : ["/[a-zA-Z1-9]/",1,50,'foo']
        }
    }

#### 1. Get an HTML Element

Next we can retrieve an HTML Table with tabbed input values for `option_constraints`
The first level of constrains are given Tab selectors. (in the case of this example `property` would be a tab)

    var tabbedTableElement = RPG.optionCreator.getOptionTabs(option_constraints,null,null,null,'opts');


Or Retrieve an HTML Table with input values for `option_constraints` with the id 'opts'

    var tableElement = RPG.optionCreator.getOptionTable(option_constraints,null,null,null,'opts');

<a name="create"></a>

#### 2. Retrieve an `options` object from an HTML Element

Upon filling out the option values in the table 'opts' from above we retrieve an `options` object from the table with all the values from the input elements

    var options = RPG.optionCreator.getOptionsFromTable(null,'opts');

Our populated `options` object looks something like this and is identical in structure to the `option_constraints`

    {
        property : {
            size : {
                height : 10,
                width : 10
            },
            name : 'foo'
        }
    }

<a name="validate"></a>

#### 3. Validate an `options` object

Now that we have the input `options` values we need to validate it against the `option_constraints`.
The `validate` function returns an `array` of `errors` or an empty array if no errors were encountered.

    var errors = RPG.optionValidator.validate(options,option_constraints);

<a name="random"></a>

## Seeded Random Options

Using the `constrains_options` object from above we can generate random values for our `options` object

    var random_options = RPG.optionCreator.random(option_constraints,RPG.Random);

`random_options` should look something like this:

    {
        property : {
            size : {
                height : 16.349812938993434, //(random float between 0 and 50)
                width : 32.9012938910923123  //(random float between 0 and 50)
            },
            name : 'alkjapioefkjawoiqoweioasd' //Uses RPG.Generator.Name to create a random name between 1 and 50 chars long
        }
    }

The use of `RPG.Generator.Name` for random strings is only a stop-gap solution and needs to be further refined.



<a name="merge"></a>

## Merging Constraint Options

Primarily used with `RPG.Tiles` so i'll use that as the example.

We will be recursively merging together the `options` from the object such that child options override parent options.

**Example** `RPG.Tiles` object.

    terrain : {
        options : {
            name : ["/[a-zA-Z]/",1,10],
        },
        grass : {
            options : {
                name: ["/[a-zA-Z1-9]/",5,25],
                color : ['green','brown']
            },
            marijuana : {
                options : {
                    name : ['kush','lambs breath','etc'],
                    stickiness : [0,10,1],
                    color : ['green','brown',purple]
                }
            }
        }
    }

Perform the merge using `RPG.optionValidator.getConstraintOptions`(`path`,`constraints`)

* `path` : the path to the child object. can be a string or array:
    * example : `['terrain','grass']` or `'terrain.grass'`
* `constraints` : the object holding the constraint values to be merged.
    * example : `RPG.Tiles`

`path` = `['terrain']`

    var constraints = RPG.optionValidator.getConstraintOptions(['terrain'], RPG.Tiles);

    constraints.name : ["/[a-zA-Z]/",1,10]
    constraints.color : undefined
    constraints.stickiness : undefined

`path` = `['terrain','grass']`

    var constraints = RPG.optionValidator.getConstraintOptions(['terrain','grass'], RPG.Tiles);

    constraints.name : ["/[a-zA-Z1-9]/",5,25]
    constraints.color : ['green','brown']
    constraints.stickiness : undefined

`path` = `['terrain','grass','marijuana']`

    var constraints = RPG.optionValidator.getConstraintOptions(['terrain','grass','marijuana'], RPG.Tiles);

    constraints.name : ['kush','lambs breath','etc']
    constraints.color : ['green','brown',purple]
    constraints.stickiness : [0,10,1]
