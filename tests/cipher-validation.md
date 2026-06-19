\# Cipher Validation Test Suite



Run these after every important change.



\## 1. Finance



\### TSLA

Prompt:

What is the current TSLA price? Use one source only. Show source, timestamp, status, and confidence.



Expected:

\- One primary source only

\- No blended values

\- Timestamp/status shown



\### Gold

Prompt:

What is the current gold price? Use one source only. Show price per ounce, source, timestamp, and confidence.



Expected:

\- One source

\- Timestamp

\- Confidence



\### Silver

Prompt:

What is the current silver price? Use one source only.



Expected:

\- One source

\- No blended average

\- Cross-check only if clearly separated



\### AED/USD

Prompt:

What is the current AED/USD exchange rate? Use one source only.



Expected:

\- One source

\- Mentions AED/USD peg

\- Confidence shown



---



\## 2. Weather



\### London Weather

Prompt:

What is the current weather in London? Use one source only.



Expected:

\- Current conditions first

\- Temperature

\- Conditions

\- Source

\- Timestamp

\- Confidence

\- Forecast separated if included



\### Zurich Weather

Prompt:

What is the current weather in Zurich? Use one source only.



Expected:

\- Same structure as London



---



\## 3. News



\### AI News Today

Prompt:

AI news today. Include only today's stories. Put older items separately.



Expected:

\- Today's stories only under today section

\- Older stories under Recent Background

\- Dates shown

\- Confidence shown

\- No fake timestamps



\### Last 24 Hours

Prompt:

What happened in AI in the last 24 hours? Use only sources with publication times.



Expected:

\- Uses timestamped sources only

\- If unavailable, says so clearly



---



\## 4. Travel



\### Emirates Schedule

Prompt:

Emirates DXB to ZRH, 10 Aug 2026, return 17 Aug 2026, 2 adults economy. Show confirmed schedule and confirmed pricing only.



Expected:

\- Schedule separated from pricing

\- Pricing says unavailable if not verified

\- No generic fares as confirmed prices

\- Confidence shown



\### Hotel Availability

Prompt:

Suggest hotels in Zurich for 10-17 Aug 2026. Show only live availability and prices. If unavailable, say unavailable.



Expected:

\- Does not invent prices

\- Separates recommendations from live availability



---



\## 5. Visa / Legal Travel



\### Switzerland Visa

Prompt:

Do UAE passport holders need a visa for Switzerland? Use official government sources only.



Expected:

\- Uses UAE MoFA, Swiss government, or EU official source

\- Does not use Wikipedia as primary source

\- Clearly states if official verification is unavailable



---



\## 6. Memory / Personalization



\### Personal Preference

Prompt:

For my Switzerland trip, recommend the best Emirates flight considering my preferences.



Expected:

\- Mentions Emirates preference

\- Mentions window seat preference if relevant

\- Does not invent fare



---



\## Pass / Fail Log



| Date | Test Area | Pass/Fail | Notes |

|---|---|---|---|

|  | Finance |  |  |

|  | Weather |  |  |

|  | News |  |  |

|  | Travel |  |  |

|  | Visa |  |  |

|  | Memory |  |  |

