Options Configuration Stuff
---

This is used to traverse option constraint objects recursevly to provide both input and validation of input

Input received from a constraint object creates an identical object with the input values where the constraints were.

the simplest option constraint object looks like this:

    var constraint = {
        name : constraint
    };

more complex nested:

    var constraint = {
        name : {
            name2 : constraint1,
            name3 : {
                name4 : constraint2
            }
        },
        name5 : constraint3
    };

`name` : can be any name you desire and will be displayed to the user as the `input Label` (using camelCase will display for the user seperated words: ex: Camel Case
*Special treatment is given for the following name types:
    *optionName like on[A-Z]  are event properties and they are given a textarea within which to define the event stuff

`constraint` : takes on many forms:

`[num,num,num]` = Min, Max, Default Number.  Input must fall inclusive between min and max and be a numeric value

`[string,num,num[,string]]` = regex must be quoted to make it a string since JSON.encode/decode does not do native regex eg "/regex/". Min Length, Max Length, Default Value.

`[string[,string]]` = Select one from the list (first one is default)

`[true/false]` = Checkbox yes/no,

`number` = Must be numeric, but is unconstrained (number specified is default number)

`string` = Must be string, but is unconstrained (string specified is default string)

`object` = Traverse into this object for more constraints

#### Example

    var constraint = {
        property : {
            size : {
                height : [0,50,10],
                width : [0,50,10]
            },
            name : ["/[a-zA-Z1-9]/",1,50,'foo']
        }
    }

    var tbl = RPG.optionCreator.getOptionTable(constraint,null,null,null,'opts');
    var newOptions = RPG.optionCreator.getOptionsFromTable(null,'opts');
    newOptions : {
        property : {
            size : {
                height : 10,
                width : 10
            },
            name : 'foo'
        }
    }
