
Funnier <: Funny {
    FunctionDef
        = identifier _ "(" _ ParameterList? _ ")" _
          FunctionRequires?
          "returns" _ ParameterList _
          FunctionEnsures?
          FunctionLocals?
          Statement

    FunctionRequires
        = "requires" _ Predicate _

    FunctionEnsures
        = "ensures" _ Predicate _

    While
        = "while" _ "(" _ Condition _ ")" _
          WhileInvariant?
          Statement

    WhileInvariant
        = "invariant" _ Predicate _

    Predicate
        = Predicate _ "and" _ Predicate --and
        | Predicate _ "or" _ Predicate --or
        | Predicate _ "->" _ Predicate --implies
        | "not" _ Predicate --not
        | "(" _ Predicate _ ")" --paren
        | "true" --true
        | "false" --false
        | Comparison --comparison
        | Quantifier --quantifier

    Quantifier
        = QuantifierType _ "(" _ ParameterDef _ "|" _ Predicate _ ")"

    QuantifierType
        = "forall" --forall
        | "exists" --exists

    Condition += Condition _ "->" _ Condition --implies
}
