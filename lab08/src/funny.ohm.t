
Funny <: Arithmetic {
    Module
        = _ FunctionDef+ _

    FunctionDef
        = identifier _ "(" _ ParameterList? _ ")" _
          "returns" _ ParameterList _
          FunctionLocals?
          Statement

    FunctionLocals
        = "uses" _ ParameterList _

    ParameterList
        = ParameterDef _ "," _ ParameterList --many
        | ParameterDef                       --one

    ParameterDef
        = identifier _ ":" _ Type

    Type
        = "int[]" --array
        | "int"   --int

    Statement
        = Block        --block
        | Assignment   --assign
        | Conditional  --if
        | While        --while

    Block
        = "{" _ Statement* _ "}"

    Assignment
        = AssignmentTargets _ "=" _ Expression _ ";"

    AssignmentTargets
        = AssignmentTarget _ "," _ AssignmentTargets --many
        | AssignmentTarget                       --one

    AssignmentTarget
        = identifier _ "[" _ Expression _ "]" --array
        | identifier                            --identifier

    Conditional
        = "if" _ "(" _ Condition _ ")" _ Statement _ ElseClause?

    ElseClause
        = "else" _ Statement

    While
        = "while" _ "(" _ Condition _ ")" _ Statement

    Condition
        = "true"                   --true
        | "false"                  --false
        | "not" _ Condition        --not
        | Condition _ "and" _ Condition --and
        | Condition _ "or" _ Condition  --or
        | "(" _ Condition _ ")"    --paren
        | Comparison               --comparison

    Comparison
        = Expression _ CompareOp _ Expression

    CompareOp
        = "==" --eq
        | "!=" --ne
        | ">=" --ge
        | "<=" --le
        | ">"  --gt
        | "<"  --lt

    Expression
        = FunctionCall --call
        | Additive     --arith

    FunctionCall
        = identifier _ "(" _ ArgumentList? _ ")"

    ArgumentList
        = Expression _ "," _ ArgumentList --many
        | Expression                      --one

    Primary :=
        FunctionCall                              --call
        | identifier _ "[" _ Expression _ "]"    --arrayAccess
        | number                                  --number
        | variable                                --variable
        | "(" _ Additive _ ")"                   --paren

    identifier = letter alnum*

    spacing += comment

    comment
        = "//" (~"\n" any)* ("\n" | end)
}
