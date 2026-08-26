const downtime_report = [
  {
    id: "DTR-20260804-1785802646115", // Auto generated ito based sa date at timestamp.
    doc_code: "DTR-20260804-1785802646115", // Auto generated ito based sa date at timestamp.
    doc_owner: "PRODUCTION DEPARTMENT", // By default ito talaga ang data dito.
    issue_no: "01", // By default ito talaga ang data dito.
    revision_no: "01", // By default ito talaga ang data dito.
    revision_date: "2026-08-04T00:17:26.265Z", // By default ito talaga ang data dito.
    effect_date: "2026-08-04T00:17:26.265Z", // By default ito talaga ang data dito.
    control_no: "26-152", // By default ito talaga ang data dito.
    machine_no: "15", // Manual Input ito.
    product: "M LAMPEIN", // Manual Input ito
    shift: "DAY", // Selection ito. DAY or NIGHT lang iseselect ni user.
    creation_date: "2026-08-04T00:17:26.265Z", // Automatic ito... Kung kailan ginawa yung report.
    operator_ic: "Sem Sianghio", // Manual Input ito.
    qc_line_ic: "Sem Sianghio", // Manual Input ito.
    // Ito yung list ng downtime. Sa kada isang downtime report kasi, pwede magkaroon ng multiple downtime list.
    // for example sa 1st downtime pwede ilagay ni user downtime_start: "6:00 AM" at downtime_end: "6:23 AM".
    // Kaya may total of 23 minutes. At iba pang input fields.
    downtime_list: [
      {
        downtime_start: "",
        downtime_end: "",
        minutes: 0, // Auto-calculation ito kung gaano katagal from downtime_start to downtime_end. Ilang minutes yung duration non.
        downtime_cause: "", // Mejo mahaba ito kaya kailangan multiline and input.
        quality_issue: "", // Mejo mahaba ito kaya kailangan multiline and input.
        correct_action: "", // Mejo mahaba ito kaya kailangan multiline and input.
        remarks: "", // Isang line lang ito.
      },
    ],
    total_minutes: 0, // Ito ay summation ng lahat ng downtime_list.minutes
    reprocess: 0, // float ito dahil pwede magkaroon ng decimal
    counter: 0, // float ito dahil pwede magkaroon ng decimal
    total_reject: 0, // float ito dahil pwede magkaroon ng decimal
    rm_waste: 0, // float ito dahil pwede magkaroon ng decimal
    note: "", // Mejo mahaba ito kaya kailangan multiline and input.
  },
];

// Bali 5 Stack page ang kailangan mo.
// 1st page: Downtime report (Dito naka list yung mga ginawa ni user na downtime report)
// 2nd page: Madidisplay dito yung data ng downtime report, at sa ibaba non ay may scrollable na downtime_list.
// (Ito yung list ng bawat downtime sa specific na downtime_report)
// 3rd page: Edit Downtime report (Ito naman ay para iedit yung specific downtime report)
// 4th page: ito yung page kung saan mapupunta si user para gumawa ng specific downtime list para sa specific downtime_report.
// 5th page: ito yung page kung saan ma eedit ni user yung nacreate niyang downtime report. Pero pinagkaiba... mapupunta lang si user
// sa page na ito kapag nag click siya ng specific downtime report sa 1st page.

// Ito naman yung flow sa pag gawa ng downtime report:

// 1. Iciclick ni user yung "Create New Report"

// 2. Mapupunta si user sa page kung saan ififill up niya yung mga fields na ito...
// machine_no
// product
// shift
// operator_ic
// qc_line_ic

// 3. Mag a-add si user sa downtime_list, ki-click ni user yung FAB + button sa bottom right corner para then mapupunta siya sa next page kung saan
// doon siya mag iinput ng mga sumusunod:
// - downtime_start: "",
// - downtime_end: "",
// - minutes: 0, // Disabled: Auto-calculation ito kung gaano katagal from downtime_start to downtime_end. Ilang minutes yung duration non.
// - downtime_cause: "", // Mejo mahaba ito kaya kailangan multiline and input.
// - quality_issue: "", // Mejo mahaba ito kaya kailangan multiline and input.
// - correct_action: "", // Mejo mahaba ito kaya kailangan multiline and input.
// - remarks: "", // Isang line lang ito.
// After niya maglagay ng mga details jan. Sa pinaka baba ay may "Add" Button. Pag click niya non ay mag add na yung data sa downtime_list: [] array at babalik
// na yung page doon sa downtime report page
// Ngayon kung mag aadd ulit siya ng panibagong data sa downtime_list, kailangan pindutin niya ulit yung FAB + Button
// Locally lang nasesave yung mga ginagawa niya sa downtime_list. Masesave lang ito sa database kapag clinick niya na yung "Save" Button na naka stick sa pinaka
// ibaba ng screen doon sa page ng creation ng downtime report.
// kailangan sa kada downtime_list na naka list, pwede din iedit ni user yon, ikiclick niya lang yung specific card na gusto niya iedit.
// Pwede din dapat siya mag delete ng specific downtime_list, kaya dapat may trash button sa upper right corner ng card ng bawat downtime_list

// Bali 5 ang page na kailangan natin.
// 1. Downtime_Report.jsx // List of all downtime report
// 2. Create_Downtime.jsx // Creation of downtime report
// 3. Edit_Downtime.jsx // Edit of downtime report
// 4. Add_Report. // Add data to downtime_list: [] array
// 5. Edit_Report.jsx // Edit data to downtime_list: [] array

// NOTE: Sa lahat ng input ko... Ayaw ko ng direct yung input field. Gusto ko ay clickable tapos magpopop up yung modal kung saan doon mag iinput si user.
// Kapag okay na yung input niya doon... pipindutin niya lang yung "Confirm" or "Cancal" para mag reflect yon sa input box

// Meron akong sample code dito. Dapat yung gagawin mong UI ay kaparehas ng UI format sa ibang components. Lalo na yung header. Kailangan unified yung header.
// Kung ano yung design ko dito dapat ganon din yung magiging design natin.

const downtime_report_data = [
  {
    control_no: "26-152",
    counter: 226653,
    created_by: "Sem Sianghio",
    creation_date: "2026-08-05T16:52:11.452Z",
    creation_date_sort: "2026-08-06",
    doc_code: "DTR-1785948731452",
    doc_owner: "PRODUCTION DEPARTMENT",
    downtime_list: [
      {
        correct_action: "Re-adjust rugs of transferring then replace mesh belt",
        downtime_cause: "N/S trouble due to filing problem",
        downtime_end: "6:23 AM",
        downtime_start: "6:00 AM",
        minutes: 23,
        quality_issue: "",
        remarks: "Section 10",
      },
      {
        correct_action: "Re-align",
        downtime_cause: "Waistline crimp teeth disalign",
        downtime_end: "6:48 AM",
        downtime_start: "6:33 AM",
        minutes: 15,
        quality_issue: "Cutter sealed weak",
        remarks: "Section 9",
      },
    ],
    effect_date: "2026-08-05T16:52:11.452Z",
    id: "DTR-1785948731452",
    issue_no: "01",
    machine_no: "15",
    note: "Low speed 380/410, tumataas ang servo G42.",
    operator_ic: "Sem Sianghio",
    product: "M Lampein",
    qc_line_ic: "Sem Sianghio",
    reprocess: 124.62,
    revision_date: "2026-08-05T16:52:11.452Z",
    revision_no: "01",
    rm_waste: 0.99,
    shift: "DAY",
    total_minutes: 38,
    total_reject: 242,
    username_ref: "19513",
  },
];

// Ito yung sample dataset ng isang downtime report. Kailangan ko magkaroon ng print out report base sa dataset na ito.
// Ito yung mga fields na ilalagay mo sa mga specific na label sa print out report.
// 1. Control No. = control_no
// 2. Document Code = doc_code
// 3. Document Owner = doc_owner
// 4. Issue No. = issue_no
// 5. Revision No. = revision_no
// 6. Revision Date = revision_date
// 7. Effectivity Date = effect_date
// 8. Machine No. = machine_no
// 9. Product = product
// 10. Shift = shift
// 11. Date = creation_date
// 12. Operator In-Charge = operator_ic
// 13. QC in Line In-Charge = qc_line_ic
// 14. Downtime Table
// 14.1. Downtime = ${downtime_list.downtime_start} - ${downtime_list.downtime_end}
// 14.2. Minutes = downtime_list.minutes
// 14.3. Cause of Downtime = downtime_list.downtime_cause
// 14.4. Quality Issue = downtime_list.quality_issue
// 14.5. Corrective Action = downtime_list.correct_action
// 14.6. Remarks = downtime_list.remarks
// 15. Note = note
// 16. Total Minutes = total_minutes
// 17. Reprocess = reprocess
// 18. Counter = counter
// 19. Total Reject = total_reject
// 20. RM Waste = rm_waste

// Ngayon ang susundin mong layout ay yung sinend kong image. Hiniwalay ko yung mga section/container

// Container 1: Ito yung header, sa pinakataas, dito nakalagay yung:
// 1. Generated Report
// 2. Control No.:
// 3. DOCUMENT CODE
// 4. DOCUMENT TITLE / DESCRIPTION PRODUCTION DAILY DOWNTIME REPORT
// 5. DOCUMENT OWNER
// 6. ISSUE NO.
// 7. REVISION NO.
// 8. REVISION DATE
// 9. EFFECTIVITY DATE
// 10. NO OF PAGES (Kailangan natin ito dahil yung header ay nauulit dapat sa panibagong page. At nag uupdate dapat ito base sa page.
// halimbawa: page 1 ay nakalagay 1-2. Yung page 2 ay magiging 2-2)

// Container 2: Ito yung susunod sa header (nauulit din ito kada page kasi)
// 1. Machine No.
// 2. Product
// 3. Shift
// 4. Date (creation date)
// 5. Page No. (umuulit din ito dahil nag uupdate ito base sa page. pero nakalagay lang dito kung 1, 2, 3, and so on.)

// Container 3: Ito yung naka assign na tao sa report (Nauulit din ito kada page.)
// 1. Operator In-Charge
// 2. QC in Line In-Charge

// Itong container 1 to 3, kada may bagong page, ay dapat nasa taas lagi ito. Yung dami kasi ng page ay naka base sa kung gaano kadami yung downtime_list: []

// Container 4: Ito naman yung list ng downtime report (Dito naka base sa kung gaano kadaming page yung report dahil kung halimbawa 10 downtime_list ito. Hindi ito kasiya sa isang page kaya mag mumultiple pages)
// 1. NO.
// 2. DOWNTIME
// 3. MINUTES
// 4. CAUSE OF DOWNTIME
// 5. QUALITY ISSUE
// 6. CORRECTIVE ACTION
// 7. REMARKS / SECTION

// Container 5: Note (Ito naman yung pangalawa sa huli. Hindi ito nauulit kada page dahil dapat nakalagay lang ito sa last page kung saan nagtatapos yung table ng downtime_list : [])

// Container 6: Ito naman yung pinka huli. Dito may Recorded By, Reviewed By, Acknowledgement By, (sundan mo lang yun layout sa image).
// Nandito din yung Total Minutes, Reprocess, Counter, Total Reject, RM Waste.

// So yung printout report na ito, dapat magkakadikit yung border niya. Hiniwalay ko lang sa image para malaman mo yung by container at para ma identify mo kung ano yung magkakasama.

// Gagamit tayo ng...
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// Gagawa din tayo ng js file na: generate_downtime_report.js at nandito yung function ng print out. May parameter itong downtime_data dahil dito natin ipapasa yung dataset ng downtime.

// Ipakita ang full code para dito. Thank you!
