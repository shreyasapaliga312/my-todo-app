import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  background: "#302D28",
  card: "#242321",
  text: "#FFFFFF",
  secondary: "#AAA7A1",
  accent: "#E44C55",
  yellow: "#E8A93B",
  green: "#75A987",
  border: "#494640",
};

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  return getDateString(new Date());
}

function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

type Task = {
  id: string;
  title: string;
  date: string;
  completed: boolean;
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentScreen, setCurrentScreen] = useState("Today");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const saved = await AsyncStorage.getItem("tasks");

      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (error) {
      console.log("Error loading tasks:", error);
    }
  }

  async function saveTasks(updatedTasks: Task[]) {
    try {
      await AsyncStorage.setItem(
        "tasks",
        JSON.stringify(updatedTasks)
      );
    } catch (error) {
      console.log("Error saving tasks:", error);
    }
  }

  function addTask() {
    if (newTask.trim().length === 0) {
      Alert.alert(
        "Enter a task",
        "Please enter a task name."
      );

      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.trim(),
      date: selectedDate,
      completed: false,
    };

    const updatedTasks = [...tasks, task];

    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    setNewTask("");
    setShowCalendar(false);
    setShowAddModal(false);
  }

  function openAddTask() {
    setShowCalendar(false);
    setShowAddModal(true);
  }

  function toggleTask(id: string) {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
        };
      }

      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }

  function deleteTask(id: string) {
    Alert.alert(
      "Delete task?",
      "Do you want to delete this task?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedTasks = tasks.filter(
              task => task.id !== id
            );

            setTasks(updatedTasks);
            saveTasks(updatedTasks);
          },
        },
      ]
    );
  }

  function getVisibleTasks() {
    const today = getToday();

    if (currentScreen === "Today") {
      return tasks.filter(
        task => task.date === today
      );
    }

    if (currentScreen === "Upcoming") {
      return tasks
        .filter(task => task.date >= today)
        .sort((a, b) =>
          a.date.localeCompare(b.date)
        );
    }

    return tasks;
  }

  const visibleTasks = getVisibleTasks();

  function getScreenTitle() {
    if (currentScreen === "Today") {
      return "Today";
    }

    if (currentScreen === "Upcoming") {
      return "Upcoming";
    }

    return "Inbox";
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {getScreenTitle()}
          </Text>

          {currentScreen === "Upcoming" && (
            <Text style={styles.selectedDateHeader}>
              {formatDate(selectedDate)}
            </Text>
          )}
        </View>

        <TouchableOpacity>
          <Ionicons
            name="ellipsis-vertical"
            size={25}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {currentScreen === "Upcoming" ? (
        <UpcomingScreen
          tasks={tasks}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
      ) : (
        <TaskList
          tasks={visibleTasks}
          screen={currentScreen}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={openAddTask}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={38}
          color="white"
        />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <NavButton
          icon="file-tray-outline"
          title="Inbox"
          active={currentScreen === "Inbox"}
          onPress={() =>
            setCurrentScreen("Inbox")
          }
        />

        <NavButton
          icon="calendar-outline"
          title="Today"
          active={currentScreen === "Today"}
          onPress={() =>
            setCurrentScreen("Today")
          }
        />

        <NavButton
          icon="calendar-number-outline"
          title="Upcoming"
          active={currentScreen === "Upcoming"}
          onPress={() =>
            setCurrentScreen("Upcoming")
          }
        />

        <NavButton
          icon="menu-outline"
          title="More"
          active={false}
          onPress={() =>
            Alert.alert(
              "More",
              "More features coming soon."
            )
          }
        />
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCalendar(false);
          setShowAddModal(false);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                New Task
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowCalendar(false);
                  setShowAddModal(false);
                }}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="What do you need to do?"
              placeholderTextColor="#777"
              value={newTask}
              onChangeText={setNewTask}
              autoFocus
            />

            <Text style={styles.label}>
              Schedule
            </Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() =>
                setShowCalendar(!showCalendar)
              }
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={COLORS.accent}
              />

              <Text style={styles.dateText}>
                {formatDate(selectedDate)}
              </Text>

              <Ionicons
                name={
                  showCalendar
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={20}
                color={COLORS.secondary}
                style={{
                  marginLeft: "auto",
                }}
              />
            </TouchableOpacity>

            {showCalendar && (
              <MiniCalendar
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={addTask}
            >
              <Text style={styles.saveButtonText}>
                Add Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TaskList({
  tasks,
  screen,
  toggleTask,
  deleteTask,
}: {
  tasks: Task[];
  screen: string;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="checkmark"
            size={55}
            color={COLORS.green}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {screen === "Today"
            ? "What do you need to get done today?"
            : "Your inbox is empty"}
        </Text>

        <Text style={styles.emptyText}>
          Tap + to add a new task
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.taskList}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          showDate={screen === "Inbox"}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
        />
      )}
    />
  );
}

function TaskItem({
  task,
  showDate,
  toggleTask,
  deleteTask,
}: {
  task: Task;
  showDate: boolean;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  return (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.completed &&
            styles.checkboxCompleted,
        ]}
        onPress={() =>
          toggleTask(task.id)
        }
      >
        {task.completed && (
          <Ionicons
            name="checkmark"
            size={18}
            color="white"
          />
        )}
      </TouchableOpacity>

      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskTitle,
            task.completed &&
              styles.completedText,
          ]}
        >
          {task.title}
        </Text>

        {showDate && (
          <View style={styles.taskDate}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={COLORS.yellow}
            />

            <Text style={styles.taskDateText}>
              {task.date === getToday()
                ? "Today"
                : formatShortDate(task.date)}
            </Text>
          </View>
        )}
      </View>

      {/* DELETE BUTTON - only new change */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          deleteTask(task.id)
        }
        activeOpacity={0.7}
      >
        <Ionicons
          name="trash-outline"
          size={22}
          color={COLORS.accent}
        />
      </TouchableOpacity>
    </View>
  );
}

function UpcomingScreen({
  tasks,
  selectedDate,
  setSelectedDate,
  calendarDate,
  setCalendarDate,
  toggleTask,
  deleteTask,
}: {
  tasks: Task[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  const selectedTasks = tasks.filter(
    task => task.date === selectedDate
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={
        styles.upcomingContent
      }
    >
      <Calendar
        date={calendarDate}
        setDate={setCalendarDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <View style={styles.selectedDayHeader}>
        <View>
          <Text style={styles.selectedDayTitle}>
            {selectedDate === getToday()
              ? "Today"
              : formatDate(selectedDate)}
          </Text>

          <Text
            style={styles.selectedDaySubtitle}
          >
            {selectedTasks.length === 0
              ? "No tasks for this day"
              : `${selectedTasks.length} ${
                  selectedTasks.length === 1
                    ? "task"
                    : "tasks"
                }`}
          </Text>
        </View>

        <Ionicons
          name="calendar"
          size={25}
          color={COLORS.accent}
        />
      </View>

      {selectedTasks.length === 0 ? (
        <View style={styles.selectedEmpty}>
          <View style={styles.smallEmptyIcon}>
            <Ionicons
              name="add"
              size={30}
              color={COLORS.accent}
            />
          </View>

          <Text
            style={styles.selectedEmptyTitle}
          >
            No tasks yet
          </Text>

          <Text
            style={styles.selectedEmptyText}
          >
            Tap the + button to create a task
            for this date.
          </Text>
        </View>
      ) : (
        selectedTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            showDate={false}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
          />
        ))
      )}
    </ScrollView>
  );
}

function Calendar({
  date,
  setDate,
  selectedDate,
  setSelectedDate,
}: {
  date: Date;
  setDate: (date: Date) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthName = date.toLocaleDateString(
    "en-US",
    {
      month: "long",
    }
  );

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    days.push(i);
  }

  function previousMonth() {
    setDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  }

  function nextMonth() {
    setDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  }

  function selectDate(day: number) {
    const clickedDate = new Date(
      year,
      month,
      day
    );

    setSelectedDate(
      getDateString(clickedDate)
    );
  }

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={previousMonth}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {monthName} {year}
        </Text>

        <TouchableOpacity
          style={styles.monthArrow}
          onPress={nextMonth}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {[
          "S",
          "M",
          "T",
          "W",
          "T",
          "F",
          "S",
        ].map((day, index) => (
          <Text
            key={index}
            style={styles.weekDay}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={index}
                style={styles.calendarCell}
              />
            );
          }

          const currentDate = new Date(
            year,
            month,
            day
          );

          const dateString =
            getDateString(currentDate);

          const isSelected =
            dateString === selectedDate;

          const isToday =
            dateString === getToday();

          return (
            <TouchableOpacity
              key={index}
              style={styles.calendarCell}
              onPress={() =>
                selectDate(day)
              }
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.dateCircle,
                  isToday &&
                    !isSelected &&
                    styles.todayCircle,
                  isSelected &&
                    styles.selectedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.calendarNumber,
                    isToday &&
                      !isSelected &&
                      styles.todayText,
                    isSelected &&
                      styles.selectedText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MiniCalendar({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const [calendarDate, setCalendarDate] =
    useState(
      new Date(
        selectedDate + "T00:00:00"
      )
    );

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthName =
    calendarDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
      }
    );

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const days:
    (number | null)[] = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    days.push(null);
  }

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    days.push(i);
  }

  function previousMonth() {
    setCalendarDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  }

  function nextMonth() {
    setCalendarDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  }

  function selectDate(day: number) {
    const newDate =
      new Date(
        year,
        month,
        day
      );

    setSelectedDate(
      getDateString(newDate)
    );
  }

  return (
    <View style={styles.miniCalendar}>
      <View
        style={styles.calendarHeader}
      >
        <TouchableOpacity
          onPress={previousMonth}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text
          style={styles.monthTitle}
        >
          {monthName} {year}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {[
          "S",
          "M",
          "T",
          "W",
          "T",
          "F",
          "S",
        ].map(
          (day, index) => (
            <Text
              key={index}
              style={styles.weekDay}
            >
              {day}
            </Text>
          )
        )}
      </View>

      <View
        style={styles.calendarGrid}
      >
        {days.map(
          (day, index) => {
            if (
              day === null
            ) {
              return (
                <View
                  key={index}
                  style={
                    styles.calendarCell
                  }
                />
              );
            }

            const currentDate =
              new Date(
                year,
                month,
                day
              );

            const dateString =
              getDateString(
                currentDate
              );

            const isSelected =
              dateString ===
              selectedDate;

            const isToday =
              dateString ===
              getToday();

            return (
              <TouchableOpacity
                key={index}
                style={
                  styles.calendarCell
                }
                onPress={() =>
                  selectDate(day)
                }
              >
                <View
                  style={[
                    styles.dateCircle,

                    isToday &&
                      !isSelected &&
                      styles.todayCircle,

                    isSelected &&
                      styles.selectedCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarNumber,

                      isToday &&
                        !isSelected &&
                        styles.todayText,

                      isSelected &&
                        styles.selectedText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
        )}
      </View>
    </View>
  );
}

function NavButton({
  icon,
  title,
  active,
  onPress,
}: {
  icon: any;
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
    >
      <View
        style={[
          styles.navIconContainer,
          active &&
            styles.navActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={25}
          color={
            active
              ? COLORS.accent
              : COLORS.secondary
          }
        />
      </View>

      <Text
        style={[
          styles.navText,
          active &&
            styles.navTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    header: {
      height: 75,
      paddingHorizontal: 25,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    headerTitle: {
      fontSize: 32,
      fontWeight: "700",
      color: COLORS.text,
    },

    selectedDateHeader: {
      color:
        COLORS.secondary,
      fontSize: 13,
      marginTop: 2,
    },

    taskList: {
      paddingHorizontal: 15,
      paddingBottom: 150,
    },

    taskCard: {
      backgroundColor:
        COLORS.card,
      borderRadius: 18,
      minHeight: 75,
      marginBottom: 10,
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    checkbox: {
      width: 25,
      height: 25,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: "#999",
      alignItems: "center",
      justifyContent:
        "center",
    },

    checkboxCompleted: {
      backgroundColor:
        COLORS.accent,
      borderColor:
        COLORS.accent,
    },

    taskInfo: {
      marginLeft: 15,
      flex: 1,
    },

    taskTitle: {
      color:
        COLORS.text,
      fontSize: 18,
    },

    completedText: {
      textDecorationLine:
        "line-through",
      color: "#777",
    },

    taskDate: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },

    taskDateText: {
      color:
        COLORS.yellow,
      marginLeft: 5,
      fontSize: 14,
    },

    /* DELETE BUTTON */
    deleteButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 35,
      paddingBottom: 100,
    },

    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor:
        "#3D493E",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
    },

    emptyTitle: {
      color:
        COLORS.text,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },

    emptyText: {
      color:
        COLORS.secondary,
      fontSize: 16,
      marginTop: 12,
      textAlign: "center",
    },

    upcomingContent: {
      paddingHorizontal: 15,
      paddingBottom: 150,
    },

    selectedDayHeader: {
      backgroundColor:
        COLORS.card,
      borderRadius: 18,
      padding: 18,
      marginBottom: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    selectedDayTitle: {
      color:
        COLORS.text,
      fontSize: 20,
      fontWeight: "700",
    },

    selectedDaySubtitle: {
      color:
        COLORS.secondary,
      fontSize: 14,
      marginTop: 4,
    },

    selectedEmpty: {
      alignItems: "center",
      paddingTop: 35,
      paddingHorizontal: 30,
    },

    smallEmptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor:
        "#4A292C",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 15,
    },

    selectedEmptyTitle: {
      color:
        COLORS.text,
      fontSize: 19,
      fontWeight: "700",
    },

    selectedEmptyText: {
      color:
        COLORS.secondary,
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 21,
    },

    addButton: {
      position: "absolute",
      right: 25,
      bottom: 100,
      width: 65,
      height: 65,
      borderRadius: 20,
      backgroundColor:
        COLORS.accent,
      alignItems: "center",
      justifyContent: "center",
      elevation: 8,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    bottomNav: {
      height: 85,
      backgroundColor:
        "#262522",
      borderTopWidth: 1,
      borderTopColor:
        "#3B3935",
      flexDirection: "row",
      justifyContent:
        "space-around",
      alignItems: "center",
    },

    navButton: {
      alignItems: "center",
      justifyContent:
        "center",
      width: 80,
    },

    navIconContainer: {
      width: 65,
      height: 38,
      borderRadius: 25,
      alignItems: "center",
      justifyContent:
        "center",
    },

    navActive: {
      backgroundColor:
        "#4A292C",
    },

    navText: {
      color:
        COLORS.secondary,
      fontSize: 14,
      marginTop: 3,
    },

    navTextActive: {
      color:
        COLORS.accent,
      fontWeight: "700",
    },

    modalBackground: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.7)",
      justifyContent:
        "flex-end",
    },

    modal: {
      backgroundColor:
        COLORS.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 25,
      minHeight: 400,
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 25,
    },

    modalTitle: {
      color:
        COLORS.text,
      fontSize: 25,
      fontWeight: "700",
    },

    input: {
      backgroundColor:
        COLORS.card,
      color:
        COLORS.text,
      borderRadius: 15,
      padding: 18,
      fontSize: 17,
      marginBottom: 20,
    },

    label: {
      color:
        COLORS.secondary,
      fontSize: 14,
      marginBottom: 8,
    },

    dateButton: {
      backgroundColor:
        COLORS.card,
      padding: 17,
      borderRadius: 15,
      flexDirection: "row",
      alignItems: "center",
    },

    dateText: {
      color:
        COLORS.text,
      fontSize: 16,
      marginLeft: 10,
    },

    saveButton: {
      backgroundColor:
        COLORS.accent,
      height: 55,
      borderRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 25,
    },

    saveButtonText: {
      color: "white",
      fontSize: 17,
      fontWeight: "700",
    },

    calendar: {
      backgroundColor:
        COLORS.card,
      borderRadius: 20,
      padding: 15,
      marginBottom: 15,
    },

    miniCalendar: {
      backgroundColor:
        COLORS.card,
      marginTop: 10,
      borderRadius: 15,
      padding: 10,
    },

    calendarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 20,
    },

    monthArrow: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:
        "#393632",
    },

    monthTitle: {
      color:
        COLORS.text,
      fontSize: 19,
      fontWeight: "700",
    },

    weekRow: {
      flexDirection: "row",
      justifyContent:
        "space-around",
      marginBottom: 10,
    },

    weekDay: {
      color:
        COLORS.secondary,
      width: 40,
      textAlign: "center",
      fontWeight: "600",
    },

    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    calendarCell: {
      width: "14.28%",
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },

    calendarNumber: {
      color:
        COLORS.text,
      fontSize: 16,
    },

    dateCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },

    todayCircle: {
      borderWidth: 1,
      borderColor:
        COLORS.accent,
    },

    todayText: {
      color:
        COLORS.accent,
      fontWeight: "700",
    },

    selectedCircle: {
      backgroundColor:
        COLORS.accent,
    },

    selectedText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
  });