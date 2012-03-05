Options Configuration Stuff
---

This is used to traverse option constraint objects recursevly to provide both input and validation of input

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

#### Example

    var option_constraints = {
        property : {
            size : {
                height : [0,50,10],
                width : [0,50,10]
            },
            name : ["/[a-zA-Z1-9]/",1,50,'foo']
        }
    }


Retrieve an HTML Table with tabbed input values for 'option_constraints'

    var tabTbl = RPG.optionCreator.getOptionTabs(option_constraints,null,null,null,'opts');


Or Retrieve an HTML Table with input values for 'option_constraints' with the id 'opts'

    var tbl = RPG.optionCreator.getOptionTable(option_constraints,null,null,null,'opts');


Upon filling out the option values in the table 'opts' from above we retrieve an options object from the table with all the values

    var options = RPG.optionCreator.getOptionsFromTable(null,'opts');

Our populated options object looks something like this and is identical in structure to the option_constraints
     {
        property : {
            size : {
                height : 10,
                width : 10
            },
            name : 'foo'
        }
    }

Now that we have the input option values we need to validate it against the option_constraints.
The `validate` function returns an `array` of `errors` or an empty array if no errors were encountered.

    var errors = RPG.optionValidator.validate(options,option_constraints);

