// Importing Libraries
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Table, Popconfirm, Button, Space, Form, Input } from "antd";
import { isEmpty } from "lodash";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";

const DataTable = () => {
  // States for table
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRowKey, setEditRowKey] = useState("");
  const [sortedInfo, setSortedInfo] = useState({});
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [searchColText, setSearchColText] = useState("");
  const [searchedCol, setSearchedCol] = useState("");
  const [filteredInfo, setFilteredInfo] = useState({});
  const [showFilter, setShowFilter] = useState(true);
  let [filteredData] = useState();
  const type = "DraggableBodyRow";
  const tableRef = useRef();

  // Loading JSON data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const response = await axios.get("http://localhost:5000/github");
    console.log(response?.data.forEach((obj) => console.log(obj.name)));
    setGridData(response.data);
    setLoading(false);
  };
  // Setting table dragable body
  const DraggableBodyRow = ({
    index,
    moveRow,
    className,
    style,
    ...restProps
  }) => {
    const ref = useRef();
    const [{ isOver, dropClassName }, drop] = useDrop({
      accept: type,
      collect: (monitor) => {
        const { index: dragIndex } = monitor.getItem() || {};
        if (dragIndex === index) {
          return {};
        }
        return {
          isOver: monitor.isOver(),
          dropClassName:
            dragIndex < index ? "drop-down-downward" : "drop-over-upward",
        };
      },
      drop: (item) => {
        moveRow(item.index, index);
      },
    });
    const [, drag] = useDrag({
      type,
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drop(drag(ref));

    return (
      <tr
        ref={ref}
        className={`${className}${isOver ? dropClassName : ""}`}
        style={{ cursor: "move", ...style }}
        {...restProps}
      />
    );
  };

  // Mapping data for each column
  const details = gridData.map((item) => ({
    ...item,
    repo: Math.floor(Math.random() * 6) + 10,
  }));

  const modifiedData = details.map(({ body, ...item }) => ({
    ...item,
    key: item.id,
    info: `My name is ${item.name} and i have ${item.repo} Repositories`,
    message: isEmpty(body) ? item.message : body,
  }));

  const moveRow = useCallback(
    (dragIndex, hoverIndex) => {
      const dragRow = modifiedData[dragIndex];
      setGridData(
        update(modifiedData, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRow],
          ],
        })
      );
    },
    [modifiedData]
  );

  // Handling the Delete functionality
  const handleDelete = (value) => {
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((item) => item.id !== value.id);
    setGridData(filteredData);
  };

  // Handling the Edit functionality
  const isEditing = (record) => {
    return record.key === editRowKey;
  };

  const cancel = () => {
    setEditRowKey("");
  };

  // Saving the Edited Data
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...modifiedData];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setGridData(newData);
        setEditRowKey("");
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const edit = (record) => {
    form.setFieldsValue({
      name: "",
      message: "",
      ...record,
    });
    setEditRowKey(record.key);
  };

  const handleChange = (_, filters, sorter) => {
    const { order, field } = sorter;
    setFilteredInfo(filters);
    setSortedInfo({ columnKey: field, order });
  };

  // Search functionality for each column
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 0, display: "block" }}
        />
        <Space style={{ marginTop: 4 }}>
          <Button
            type="primary"
            onClick={() => handleSearchCol(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleResetCol(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",
    render: (text) =>
      searchedCol === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchColText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearchCol = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setShowFilter(false);
    setSearchColText(selectedKeys[0]);
    setSearchedCol(dataIndex);
  };

  const handleResetCol = (clearFilters) => {
    clearFilters();
    setSearchColText("");
    setShowFilter(true);
  };

  // Filter component
  const filterObj = {
    filters: [
      { text: "10", value: "10" },
      { text: "11", value: "11" },
      { text: "12", value: "12" },
      { text: "13", value: "13" },
      { text: "14", value: "14" },
      { text: "15", value: "15" },
      { text: "16", value: "16" },
      { text: "17", value: "17" },
      { text: "18", value: "18" },
      { text: "19", value: "19" },
      { text: "20", value: "20" },
    ],
    filteredValue: filteredInfo.repo || null,
    onFilter: (value, record) => String(record.repo).includes(value),
  };

  const showFilterAge = showFilter ? filterObj : null;

  // All Columns from the JSON data
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      align: "center",
      editable: true,
      sorter: (a, b) => a.id.length - b.id.length,
      sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      ...getColumnSearchProps("id"),
    },
    {
      title: "Name",
      dataIndex: "name",
      align: "center",
      editable: true,
      sorter: (a, b) => a.name.length - b.name.length,
      sortOrder: sortedInfo.columnKey === "name" && sortedInfo.order,
      ...getColumnSearchProps("name"),
    },
    {
      title: "Repository",
      dataIndex: "repo",
      align: "center",
      editable: true,
      sorter: (a, b) => a.repo.length - b.repo.length,
      sortOrder: sortedInfo.columnKey === "repo" && sortedInfo.order,
      ...showFilterAge,
    },
    {
      title: "Forks",
      dataIndex: "forks",
      align: "center",
      editable: true,
      sorter: (a, b) => a.forks.length - b.forks.length,
      sortOrder: sortedInfo.columnKey === "forks" && sortedInfo.order,
      ...getColumnSearchProps("forks"),
    },
    {
      title: "Languages",
      dataIndex: "language",
      align: "center",
      editable: true,
      sorter: (a, b) => a.language.length - b.language.length,
      sortOrder: sortedInfo.columnKey === "language" && sortedInfo.order,
      ...getColumnSearchProps("language"),
    },
    {
      title: "Last Updated",
      dataIndex: "last_updated",
      align: "center",
      editable: true,
      sorter: (a, b) => a.last_updated.length - b.last_updated.length,
      sortOrder: sortedInfo.columnKey === "last_updated" && sortedInfo.order,
      ...getColumnSearchProps("last_updated"),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      render: (_, record) => {
        const editable = isEditing(record);
        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title="Are you sure want to delete ?"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger type="primary" disabled={editable}>
                Delete
              </Button>
            </Popconfirm>
            {editable ? (
              <span>
                <Space size="middle">
                  <Button
                    onClick={() => save(record.key)}
                    type="primary"
                    style={{ marginRight: 8 }}
                  >
                    Save
                  </Button>
                  <Popconfirm title="Are sure to cancel ?" onConfirm={cancel}>
                    <Button>Cancel</Button>
                  </Popconfirm>
                </Space>
              </span>
            ) : (
              <Button onClick={() => edit(record)} type="primary">
                Edit
              </Button>
            )}
          </Space>
        ) : null;
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    record,
    children,
    ...restProps
  }) => {
    const input = <Input />;

    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please input some value in ${title} field`,
              },
            ]}
          >
            {input}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const reset = () => {
    setSortedInfo({});
    setFilteredInfo({});
    setSearchText("");
    loadData();
  };

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
    if (e.target.value === "") {
      loadData();
    }
  };

  // Searching the name by Github Username
  const globalSearch = () => {
    filteredData = modifiedData.filter((value) => {
      return (
        value.name.toLowerCase().includes(searchText.toLowerCase()) ||
        value.name.toLowerCase().includes(searchText.toLowerCase()) ||
        value.message.toLowerCase().includes(searchText.toLowerCase())
      );
    });
    setGridData(filteredData);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Enter Github Username!!!"
          onChange={handleInputChange}
          type="text"
          allowClear
          value={searchText}
        />
        <Button onClick={() => globalSearch()} type="primary">
          Search
        </Button>
        <Button onClick={reset}>Reset</Button>
      </Space>
      <Form form={form} component={false}>
        <DndProvider backend={HTML5Backend}>
          <Table
            ref={tableRef}
            columns={mergedColumns}
            components={{
              body: {
                cell: EditableCell,
                row: DraggableBodyRow,
              },
            }}
            onRow={(record, index) => ({
              index,
              moveRow,
            })}
            dataSource={
              filteredData && filteredData.length ? filteredData : modifiedData
            }
            expandable={{
              expandedRowRender: (record) => (
                <p style={{ margin: 0 }}>{record.info}</p>
              ),
              rowExpandable: (record) => record.info !== "Not Expandable",
            }}
            bordered
            loading={loading}
            onChange={handleChange}
            pagination={{ position: ["bottomCenter"] }}
          />
        </DndProvider>
      </Form>
    </div>
  );
};

export default DataTable;
