/**
 * @file Templates XML partagés entre les différents types d'activités Moodle.
 * Ces templates sont embarqués directement en JavaScript pour éviter les appels réseau.
 */

/**
 * Templates XML statiques (sans ou avec peu de placeholders)
 * utilisés par plusieurs types d'activités.
 */
export const TEMPLATES = {
    // ========================================
    // Fichiers racine (niveau archive)
    // ========================================

    FILES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<files>
</files>`,

    ROLES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<roles_definition>
</roles_definition>`,

    OUTCOMES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<outcomes_definition>
</outcomes_definition>`,

    SCALES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<scales_definition>
</scales_definition>`,

    GRADE_HISTORY_XML: `<?xml version="1.0" encoding="UTF-8"?>
<grade_history>
  <grade_grades>
  </grade_grades>
</grade_history>`,

    GROUPS_XML: `<?xml version="1.0" encoding="UTF-8"?>
<groups>
  <groupcustomfields>
  </groupcustomfields>
  <groupings>
    <groupingcustomfields>
    </groupingcustomfields>
  </groupings>
</groups>`,

    QUESTIONS_XML: `<?xml version="1.0" encoding="UTF-8"?>
<question_categories>
</question_categories>`,

    COMPLETION_XML: `<?xml version="1.0" encoding="UTF-8"?>
<course_completion>
</course_completion>`,

    BADGES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<badges>
</badges>`,

    // ========================================
    // Gradebook (avec placeholders)
    // ========================================

    GRADEBOOK_XML: `<?xml version="1.0" encoding="UTF-8"?>
<gradebook>
  <attributes>
  </attributes>
  <grade_categories>
    <grade_category id="{{CATEGORY_ID}}">
      <parent>$@NULL@$</parent>
      <depth>1</depth>
      <path>/{{CATEGORY_ID}}/</path>
      <fullname>?</fullname>
      <aggregation>13</aggregation>
      <keephigh>0</keephigh>
      <droplow>0</droplow>
      <aggregateonlygraded>1</aggregateonlygraded>
      <aggregateoutcomes>0</aggregateoutcomes>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <hidden>0</hidden>
    </grade_category>
  </grade_categories>
  <grade_items>
    <grade_item id="{{COURSE_ITEM_ID}}">
      <categoryid>$@NULL@$</categoryid>
      <itemname>$@NULL@$</itemname>
      <itemtype>course</itemtype>
      <itemmodule>$@NULL@$</itemmodule>
      <iteminstance>{{COURSE_ID}}</iteminstance>
      <itemnumber>$@NULL@$</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber>$@NULL@$</idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>0.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>1</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
  <grade_settings>
    <grade_setting id="">
      <name>minmaxtouse</name>
      <value>1</value>
    </grade_setting>
  </grade_settings>
</gradebook>`,

    // ========================================
    // Templates niveau activité
    // ========================================

    ACTIVITY_ROLES_XML: `<?xml version="1.0" encoding="UTF-8"?>
<roles>
  <role_overrides>
  </role_overrides>
  <role_assignments>
  </role_assignments>
</roles>`,

    ACTIVITY_GRADE_HISTORY_XML: `<?xml version="1.0" encoding="UTF-8"?>
<grade_history>
  <grade_grades>
  </grade_grades>
</grade_history>`,

    ACTIVITY_CALENDAR_XML: `<?xml version="1.0" encoding="UTF-8"?>
<events>
</events>`,

    ACTIVITY_FILTERS_XML: `<?xml version="1.0" encoding="UTF-8"?>
<filters>
  <filter_actives>
  </filter_actives>
  <filter_configs>
  </filter_configs>
</filters>`,

    ACTIVITY_INFOREF_XML: `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <grade_itemref>
    <grade_item>
      <id>{{GRADE_ITEM_ID}}</id>
    </grade_item>
  </grade_itemref>
</inforef>`,

    // ========================================
    // Templates de grades d'activité
    // ========================================

    /**
     * Template pour grades.xml d'une activité.
     * Nécessite: GRADE_ITEM_ID, CATEGORY_ID, ACTIVITY_TITLE, ACTIVITY_ID, TIMESTAMP
     * @param {string} moduleName - Nom du module (epikmatch, simplequiz, etc.)
     */
    getActivityGradesXml: (moduleName) => `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
    <grade_item id="{{GRADE_ITEM_ID}}">
      <categoryid>{{CATEGORY_ID}}</categoryid>
      <itemname>{{ACTIVITY_TITLE}}</itemname>
      <itemtype>mod</itemtype>
      <itemmodule>${moduleName}</itemmodule>
      <iteminstance>{{ACTIVITY_ID}}</iteminstance>
      <itemnumber>0</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber>$@NULL@$</idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>1.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>2</sortorder>
      <display>2</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`,

    /**
     * Template pour module.xml d'une activité.
     * Nécessite: MODULE_ID, SECTION_ID, TIMESTAMP
     * @param {string} moduleName - Nom du module (epikmatch, simplequiz, page, etc.)
     * @param {string} moduleVersion - Version du module (ex: 2023112300)
     */
    getModuleXml: (moduleName, moduleVersion = '2023112300') => `<?xml version="1.0" encoding="UTF-8"?>
<module id="{{MODULE_ID}}" version="${moduleVersion}">
  <modulename>${moduleName}</modulename>
  <sectionid>{{SECTION_ID}}</sectionid>
  <sectionnumber>0</sectionnumber>
  <idnumber></idnumber>
  <added>{{TIMESTAMP}}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>0</groupmode>
  <groupingid>0</groupingid>
  <completion>2</completion>
  <completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>0</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <lang></lang>
  <tags>
  </tags>
</module>`,

    // ========================================
    // Templates niveau course (pour Page)
    // ========================================

    COURSE_XML: `<?xml version="1.0" encoding="UTF-8"?>
<course id="{{COURSE_ID}}" contextid="{{COURSE_CONTEXTID}}">
  <shortname>{{COURSE_SHORTNAME}}</shortname>
  <fullname>{{COURSE_FULLNAME}}</fullname>
  <idnumber>{{COURSE_ID}}-{{COURSE_SHORTNAME}}</idnumber>
  <summary>$@NULL@$</summary>
  <summaryformat>0</summaryformat>
  <format>topics</format>
  <showgrades>1</showgrades>
  <newsitems>0</newsitems>
  <startdate>0</startdate>
  <enddate>0</enddate>
  <marker>0</marker>
  <maxbytes>0</maxbytes>
  <legacyfiles>0</legacyfiles>
  <showreports>0</showreports>
  <visible>1</visible>
  <groupmode>1</groupmode>
  <groupmodeforce>0</groupmodeforce>
  <defaultgroupingid>0</defaultgroupingid>
  <lang></lang>
  <theme></theme>
  <timecreated>{{TIMESTAMP}}</timecreated>
  <timemodified>{{TIMESTAMP}}</timemodified>
  <requested>0</requested>
  <showactivitydates>0</showactivitydates>
  <showcompletionconditions>1</showcompletionconditions>
  <pdfexportfont>$@NULL@$</pdfexportfont>
  <enablecompletion>1</enablecompletion>
  <completionnotify>0</completionnotify>
  <category id="53">
    <name>caramel</name>
    <description></description>
  </category>
  <tags>
  </tags>
  <customfields>
  </customfields>
  <courseformatoptions>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>coursedisplay</name>
      <value>1</value>
    </courseformatoption>
    <courseformatoption>
      <format>topics</format>
      <sectionid>0</sectionid>
      <name>hiddensections</name>
      <value>1</value>
    </courseformatoption>
  </courseformatoptions>
</course>`,

    COURSE_ENROLMENTS_XML: `<?xml version="1.0" encoding="UTF-8"?>
<enrolments>
  <enrols>
    <enrol id="{{ENROL_MANUAL_ID}}">
      <enrol>manual</enrol>
      <status>0</status>
      <name>$@NULL@$</name>
      <enrolperiod>0</enrolperiod>
      <enrolstartdate>0</enrolstartdate>
      <enrolenddate>0</enrolenddate>
      <expirynotify>0</expirynotify>
      <expirythreshold>86400</expirythreshold>
      <notifyall>0</notifyall>
      <password>$@NULL@$</password>
      <cost>$@NULL@$</cost>
      <currency>$@NULL@$</currency>
      <roleid>5</roleid>
      <customint1>0</customint1>
      <customint2>$@NULL@$</customint2>
      <customint3>$@NULL@$</customint3>
      <customint4>$@NULL@$</customint4>
      <customint5>$@NULL@$</customint5>
      <customint6>$@NULL@$</customint6>
      <customint7>$@NULL@$</customint7>
      <customint8>$@NULL@$</customint8>
      <customchar1>$@NULL@$</customchar1>
      <customchar2>$@NULL@$</customchar2>
      <customchar3>$@NULL@$</customchar3>
      <customdec1>$@NULL@$</customdec1>
      <customdec2>$@NULL@$</customdec2>
      <customtext1>$@NULL@$</customtext1>
      <customtext2>$@NULL@$</customtext2>
      <customtext3>$@NULL@$</customtext3>
      <customtext4>$@NULL@$</customtext4>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <user_enrolments>
      </user_enrolments>
    </enrol>
    <enrol id="{{ENROL_GUEST_ID}}">
      <enrol>guest</enrol>
      <status>1</status>
      <name>$@NULL@$</name>
      <enrolperiod>0</enrolperiod>
      <enrolstartdate>0</enrolstartdate>
      <enrolenddate>0</enrolenddate>
      <expirynotify>0</expirynotify>
      <expirythreshold>0</expirythreshold>
      <notifyall>0</notifyall>
      <password></password>
      <cost>$@NULL@$</cost>
      <currency>$@NULL@$</currency>
      <roleid>0</roleid>
      <customint1>$@NULL@$</customint1>
      <customint2>$@NULL@$</customint2>
      <customint3>$@NULL@$</customint3>
      <customint4>$@NULL@$</customint4>
      <customint5>$@NULL@$</customint5>
      <customint6>$@NULL@$</customint6>
      <customint7>$@NULL@$</customint7>
      <customint8>$@NULL@$</customint8>
      <customchar1>$@NULL@$</customchar1>
      <customchar2>$@NULL@$</customchar2>
      <customchar3>$@NULL@$</customchar3>
      <customdec1>$@NULL@$</customdec1>
      <customdec2>$@NULL@$</customdec2>
      <customtext1>$@NULL@$</customtext1>
      <customtext2>$@NULL@$</customtext2>
      <customtext3>$@NULL@$</customtext3>
      <customtext4>$@NULL@$</customtext4>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <user_enrolments>
      </user_enrolments>
    </enrol>
    <enrol id="{{ENROL_SELF_ID}}">
      <enrol>self</enrol>
      <status>1</status>
      <name>$@NULL@$</name>
      <enrolperiod>0</enrolperiod>
      <enrolstartdate>0</enrolstartdate>
      <enrolenddate>0</enrolenddate>
      <expirynotify>0</expirynotify>
      <expirythreshold>86400</expirythreshold>
      <notifyall>0</notifyall>
      <password>$@NULL@$</password>
      <cost>$@NULL@$</cost>
      <currency>$@NULL@$</currency>
      <roleid>5</roleid>
      <customint1>0</customint1>
      <customint2>0</customint2>
      <customint3>0</customint3>
      <customint4>1</customint4>
      <customint5>0</customint5>
      <customint6>1</customint6>
      <customint7>$@NULL@$</customint7>
      <customint8>$@NULL@$</customint8>
      <customchar1>$@NULL@$</customchar1>
      <customchar2>$@NULL@$</customchar2>
      <customchar3>$@NULL@$</customchar3>
      <customdec1>$@NULL@$</customdec1>
      <customdec2>$@NULL@$</customdec2>
      <customtext1>$@NULL@$</customtext1>
      <customtext2>$@NULL@$</customtext2>
      <customtext3>$@NULL@$</customtext3>
      <customtext4>$@NULL@$</customtext4>
      <timecreated>{{TIMESTAMP}}</timecreated>
      <timemodified>{{TIMESTAMP}}</timemodified>
      <user_enrolments>
      </user_enrolments>
    </enrol>
  </enrols>
</enrolments>`,

    COURSE_INFOREF_XML: `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <roleref>
    <role>
      <id>5</id>
    </role>
  </roleref>
</inforef>`,

    COURSE_COMPLETIONDEFAULTS_XML: `<?xml version="1.0" encoding="UTF-8"?>
<course_completion_defaults>
</course_completion_defaults>`,

    COURSE_CONTENTBANK_XML: `<?xml version="1.0" encoding="UTF-8"?>
<contents>
</contents>`,

    // ========================================
    // Templates niveau section (pour Page)
    // ========================================

    SECTION_XML: `<?xml version="1.0" encoding="UTF-8"?>
<section id="{{SECTION_ID}}">
  <number>0</number>
  <name>$@NULL@$</name>
  <summary></summary>
  <summaryformat>1</summaryformat>
  <sequence>{{MODULE_ID}}</sequence>
  <visible>1</visible>
  <availabilityjson>$@NULL@$</availabilityjson>
  <component>$@NULL@$</component>
  <itemid>$@NULL@$</itemid>
  <timemodified>{{TIMESTAMP}}</timemodified>
</section>`,

    SECTION_INFOREF_XML: `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
</inforef>`,

    // ========================================
    // Templates pour format singleactivity (Millionnaire, etc.)
    // ========================================

    /**
     * Template course.xml pour le format singleactivity.
     * Utilise buildSingleActivityCourseXml() pour obtenir le template avec le bon moduleName.
     * @param {string} moduleName - Nom du module (millionnairev2, etc.)
     */
    getSingleActivityCourseXml: (moduleName) => `<?xml version="1.0" encoding="UTF-8"?>
<course id="{{COURSE_ID}}" contextid="{{COURSE_CONTEXTID}}">
  <shortname>{{COURSE_SHORTNAME}}</shortname>
  <fullname>{{ACTIVITY_TITLE}}</fullname>
  <idnumber>{{COURSE_ID}}-{{COURSE_SHORTNAME}}</idnumber>
  <summary>$@NULL@$</summary>
  <summaryformat>0</summaryformat>
  <format>singleactivity</format>
  <showgrades>1</showgrades>
  <newsitems>0</newsitems>
  <startdate>0</startdate>
  <enddate>0</enddate>
  <marker>0</marker>
  <maxbytes>0</maxbytes>
  <legacyfiles>0</legacyfiles>
  <showreports>0</showreports>
  <visible>1</visible>
  <groupmode>1</groupmode>
  <groupmodeforce>0</groupmodeforce>
  <defaultgroupingid>0</defaultgroupingid>
  <lang></lang>
  <theme></theme>
  <timecreated>{{TIMESTAMP}}</timecreated>
  <timemodified>{{TIMESTAMP}}</timemodified>
  <requested>0</requested>
  <showactivitydates>0</showactivitydates>
  <showcompletionconditions>1</showcompletionconditions>
  <enablecompletion>1</enablecompletion>
  <completionnotify>0</completionnotify>
  <category id="53">
    <name>0383253e</name>
    <description></description>
  </category>
  <tags>
  </tags>
  <customfields>
  </customfields>
  <courseformatoptions>
    <courseformatoption>
      <format>singleactivity</format>
      <sectionid>0</sectionid>
      <name>activitytype</name>
      <value>${moduleName}</value>
    </courseformatoption>
  </courseformatoptions>
</course>`,

    /**
     * Template section.xml pour le format singleactivity.
     * Version simplifiée sans component et itemid.
     */
    SINGLEACTIVITY_SECTION_XML: `<?xml version="1.0" encoding="UTF-8"?>
<section id="{{SECTION_ID}}">
  <number>0</number>
  <name>$@NULL@$</name>
  <summary></summary>
  <summaryformat>1</summaryformat>
  <sequence>{{MODULE_ID}}</sequence>
  <visible>1</visible>
  <availabilityjson>$@NULL@$</availabilityjson>
  <timemodified>{{TIMESTAMP}}</timemodified>
</section>`
};
