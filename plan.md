 # plan.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this fe repository.

* Please follow the guidance in the enumerated numbers:

1. This is the FE portion of the application to consume or integrate with BE side.  

2. Create for me an FE Solution using ReactJS with Vite as the framework. Observe
   the 'best practice' and industry standards in initializing and scaffolding the FE structure. I attached
	 a UI Design for you to follow. The image file is located in the /uidesign folder with filename FE_UI_1.png.
   Copy as it is except for the Become Pro Users (box) located in the lower left portion of the UI Design.

3. Create: For the Office Modal - pattern it after the Employee modal. Just change the labelling to reflect it as the Office option - so Add New Office.
Then, include Status and Actions (columns).  So, these are the  titles (labels): (corresponding is the actual fields in the BE) 

   - Office No -> officeNo
	 - Office Name -> officeName
	 - Function of the Office -> function
	 - Location of the Office -> location

You can refactor the code for software reusability - to have a template generic modal to be used based on the selected options on the menu.

4. Create: For the Property Modal - following like the Employee and Office modal and besides a reusable component is now available. Just change the labelling to reflect it as the Property option - so Add New Property.
Then, the Actions (column).  So, these are the  titles (labels): (corresponding is the actual fields in the BE)

    - Property No -> propertyNo
		- Category -> category
		- Property Name -> propertyName
		- Description -> description
		- Price -> acquisitionCost
		- Date Acquired -> acquisitionDate
		- Condition -> condition

5. Create: For the Accountability Modal - following like the Employee, Office and Property modals and besides a reusable component is now available. Just change the labelling to reflect it as the Accountability option - just with a new wording Create New Accountability. Then, the Actions (column).  So, these are the  titles (labels): (corresponding is the actual fields in the BE)

     - Accountability No. -> accountabilityNo
		 - Property Name and Description -> propertyNo (as reference) Note: Name and Description must be displayed combined. The property name shall be all capitalized followed by a comma (,) then the description.
		 - Accountability Issued To -> employeeNo (as reference) Note: The name of the employee is to be displayed.
		 - Office -> the name of the office is to be displayed based on the employeeNo as reference 
		 - Date Issued -> dateIssued
		 - Date Returned -> dateReturned
		 - Status -> status
		 - Remarks -> remarks
	
	6. Create: Reports - once the Reports button is clicked under Accountability then it shall produce a report based on all column data. For example the Accountability search output yielded all records of a certain 'Joseph Ivan Stalin' -> then that would be the data to be displayed in a certain format.
	The format is located at /uidesign/forms/AAOPForms.xlsx. So the report would be inside a 'modal' but with a much wider and taller 'screen' form. Just do the necessary adjustments to effect such output. 