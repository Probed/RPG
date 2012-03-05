Options Configuration Stuff
---

The [optionsConfig.js](https://github.com/Probed/RPG/blob/master/common/optionConfig.js) file
is used to recursively walk `options` and `option_constraints` objects to provide:
* HTML Input elements arranged in tabs/tables for each `constraint`
* Creation of `options` object from the HTML input elements.
* Validation of input values against a `option_constraints` object
* Seeded random generation of an `options` objects values from an `option_constrains` object
* Recursive merging of `options_constraints` into a single `options_constrains` (used by Tiles so child constraints override parent constraints)

Input received from a constraint object creates an identical object with the input values where the constraints were.

the simplest option constraint object looks like this:

    var option_constraints = {
        name : constraint
    };

more complex nested:

    var option_constraints = {
        name : {
            name2 : constraint1,
            name3 : {
                name4 : constraint2
            }
        },
        name5 : constraint3
    };

`name` : can be any name you desire and will be displayed to the user as the `input Label` (using camelCase will display for the user seperated words: ex: Camel Case
* Special treatment is given for the following name types:
    * optionName like on[A-Z]  are event properties and they are given a textarea within which to define the event stuff

`constraint` : takes on many forms:

* `[num,num,num]` = Min, Max, Default Number.  Input must fall inclusive between min and max and be a numeric value
* `[string,num,num[,string]]` = regex must be quoted to make it a string since JSON.encode/decode does not do native regex eg "/regex/". Min Length, Max Length, Default Value.
* `[string[,string]]` = Select one from the list (first one is default)
* `[true/false]` = Checkbox yes/no,
* `number` = Must be numeric, but is unconstrained (number specified is default number)
* `string` = Must be string, but is unconstrained (string specified is default string)
* `object` = Traverse into this object for more constraints

#### User Input Example

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


Next we can retrieve an HTML Table with tabbed input values for `option_constraints`
The first level of constrains are given Tab selectors. (in the case of this example `property` would be a tab)

    var tabbedTableElement = RPG.optionCreator.getOptionTabs(option_constraints,null,null,null,'opts');


Or Retrieve an HTML Table with input values for `option_constraints` with the id 'opts'

    var tableElement = RPG.optionCreator.getOptionTable(option_constraints,null,null,null,'opts');


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

Now that we have the input `options` values we need to validate it against the `option_constraints`.
The `validate` function returns an `array` of `errors` or an empty array if no errors were encountered.

    var errors = RPG.optionValidator.validate(options,option_constraints);

#### Seeded Random Options

Using the `constrains_options` object from above we can generate random values for our `options` object

    var random_options = RPG.optionCreator.random(option_constraints,RPG.Random);

`random_options` should look something like this:

    {
        property : {
            size : {
                height : 16.349812938993434, //(random float between 0 and 50)
                width : 32.9012938910923123  //(random float between 0 and 50)
            },
            name : 'alkjapioefkjawoiqoweioasd' //(Uses `RPG.Generator.Name` to create a random name between 1 and 50 characters long
        }
    }