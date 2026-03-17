{% test between_values(model, column_name, min_value, max_value) %}

select {{ column_name }}
from {{ model }}
where {{ column_name }} is not null
  and {{ column_name }} not between {{ min_value }} and {{ max_value }}

{% endtest %}
