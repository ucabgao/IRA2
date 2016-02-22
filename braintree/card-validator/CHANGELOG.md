2.2.5
=====

- Fixes expiration date results when year is current year and month is invalid
- Update files in `dist/`
- Readme clarifications

2.2.4
=====

- Fixes validation of space separated expiration dates
- Fixes potential validity of slashless expiration dates
- Fixes validation of expiration dates that are too long

2.2.3
=====

- Fixes CVV validation to not always validate 3-digit values as `isValid: true`

2.2.2
=====

- Fixes 3-digit expiration date handling, such as 220 being Feb, 2020

2.2.1
=====

- Use one Lodash dependency

2.2.0
=====

- CVV validator can accept an array of possible length values

2.1.0
=====

- Contextually validate month based on current date.

2.0.2
=====

- Update `credit-card-type` to 4.0.0

2.0.1
=====

- The npm module now includes built files under `dist/`.

2.0.0
=====

- The returned value for `card.length` is now an `Array` and called `card.lengths` to account for variable-length cards such as UnionPay.

1.0.0
=====

- Initial release
