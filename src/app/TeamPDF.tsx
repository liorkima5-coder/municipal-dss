import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image
} from "@react-pdf/renderer";

// רישום גופן עברי
Font.register({
  family: "Heebo",
  src: "/fonts/Heebo-Regular.ttf",
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 12,
    fontFamily: "Heebo",
    direction: "rtl",
  },

  header: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: "right",
  },

  subHeader: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "right",
    color: "#6b7280",
  },

  section: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1 solid #e5e7eb",
  },

  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cost: {
    color: "#16a34a",
    fontWeight: "bold",
  },

  small: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },

  summaryBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
  },

  logo: {
    width: 80,
    marginTop: 10,
    alignSelf: "center",
  },
});

export const TeamPDF = ({ team }: any) => {

  const totalCost = team.route_steps.reduce(
    (acc: number, curr: any) => acc + (curr.cost || 0),
    0
  );

  const today = new Date().toLocaleDateString("he-IL");

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>

        {/* כותרת */}
        <Text style={styles.header}>
          תוכנית עבודה - צוות {team.team_id}
        </Text>

        <Text style={styles.subHeader}>
          תאריך הפקה: {today}
        </Text>

        {/* פירוט משימות */}
        {team.route_steps.map((task: any, idx: number) => (
          <View key={idx} style={styles.section}>
            <View style={styles.row}>
              <Text>
                #{task.id} - {task.category}
              </Text>
              <Text style={styles.cost}>
                ₪{Math.round(task.cost)}
              </Text>
            </View>

            <Text style={styles.small}>
              מיקום: {task.lat.toFixed(4)}, {task.lon.toFixed(4)}
            </Text>
          </View>
        ))}

        {/* סיכום */}
        <View style={styles.summaryBox}>
          <Text>סה״כ משימות: {team.route_steps.length}</Text>
          <Text>סה״כ תקציב לצוות: ₪{Math.round(totalCost).toLocaleString()}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            SmartCity DSS © {new Date().getFullYear()}
          </Text>

          <Image
            src="/logo.png"
            style={styles.logo}
          />

          <Text
            render={({ pageNumber, totalPages }) =>
              `עמוד ${pageNumber} מתוך ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
};