
# PureWater API

All apis are namespaced under https://purewater.web.app/api/pwt/

## Reports: Gallon Meters In Timerange
### GET
### reports/meters_timerange
### query parameter: pwtdataid: string
### query parameter: daystart: string (e.g. '2024-10-01') beginning and INCLUDING the date
### query parameter: dayend: string (e.g. '2024-11-01') up to but EXCLUDING the date
### returns: number[] (length: 5 -- Store, Pure1, Mineral1, Pure2, Mineral2).
Returns machine meter gallons used within time frame as specified in query parameters. This accounts for any reconciliaton records added within timeframe.
A common request will be meter totals within a particular month. When a full month of meter totals is desired set daystart to the BEGINNING of that month and dayend to the BEGINNING of the NEXT month. 
For example: June 2024. daystart 06-01-2024 and dayend to 07-01-2024. 


## Reports: Gallon Meters All Time
### GET
### reports/meters_alltime
### query parameter: pwtdataid: string
### returns: number[] (length: 5 -- Store, Pure1, Mineral1, Pure2, Mineral2).
Returns machine meter gallons as grand totals throughout all time. Includes any reconcile records.  
